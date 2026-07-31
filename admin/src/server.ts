import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

const app = {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

export default app;

if (
  typeof process !== "undefined" &&
  process.argv &&
  process.argv[1] &&
  (process.argv[1].endsWith("server.js") || process.argv[1].endsWith("server.mjs")) &&
  !process.argv[1].endsWith("render-server.mjs")
) {
  import("node:http")
    .then(async (http) => {
      const fs = await import("node:fs");
      const path = await import("node:path");
      const { Readable } = await import("node:stream");
      const PORT = parseInt(process.env.PORT || "3000", 10);

      const MIME_TYPES: Record<string, string> = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".mjs": "application/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
      };

      const server = http.createServer(async (req, res) => {
        try {
          const proto =
            req.headers["x-forwarded-proto"] || ((req.socket as any).encrypted ? "https" : "http");
          const host = req.headers.host || `localhost:${PORT}`;
          const url = `${proto}://${host}${req.url}`;

          // Serve static files from dist/client if they exist
          const urlPath = new URL(url).pathname;
          const clientDir = path.resolve(process.cwd(), "dist/client");
          const filePath = path.resolve(
            clientDir,
            urlPath.startsWith("/") ? urlPath.slice(1) : urlPath,
          );

          if (
            filePath.startsWith(clientDir) &&
            fs.existsSync(filePath) &&
            fs.statSync(filePath).isFile()
          ) {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || "application/octet-stream";
            res.writeHead(200, {
              "Content-Type": contentType,
              "Cache-Control": "public, max-age=31536000, immutable",
            });
            fs.createReadStream(filePath).pipe(res);
            return;
          }

          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (v !== undefined) {
              if (Array.isArray(v)) v.forEach((val) => headers.append(k, val));
              else headers.set(k, v);
            }
          }

          let body = undefined;
          if (!["GET", "HEAD", "OPTIONS"].includes(req.method || "GET")) {
            body = Readable.toWeb(req) as any;
          }

          const request = new Request(url, {
            method: req.method,
            headers,
            body,
            // @ts-ignore — duplex needed for streaming body
            duplex: "half",
          });

          const response = await app.fetch(request, process.env, {});

          res.statusCode = response.status;
          response.headers.forEach((val, key) => res.setHeader(key, val));

          // Inject core security headers (Helmet equivalents)
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader("X-Frame-Options", "DENY");
          res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
          res.setHeader(
            "Permissions-Policy",
            "geolocation=(), camera=(), microphone=(), payment=()",
          );
          res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
          res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
          res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");

          const isProd = process.env.NODE_ENV === "production";
          if (isProd) {
            res.setHeader(
              "Strict-Transport-Security",
              "max-age=31536000; includeSubDomains; preload",
            );
            // Production CSP: minimize unsafe-inline/eval where feasible
            res.setHeader(
              "Content-Security-Policy",
              "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';",
            );
          } else {
            // Dev CSP: allow unsafe-eval for hot reloading/websockets
            res.setHeader(
              "Content-Security-Policy",
              "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https: ws: wss:; frame-ancestors 'none';",
            );
          }

          if (response.body) {
            const reader = response.body.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(value);
            }
          }
          res.end();
        } catch (err) {
          console.error("[server] Unhandled error:", err);
          res.statusCode = 500;
          res.end("Internal Server Error");
        }
      });

      server.listen(PORT, "0.0.0.0", () => {
        console.log(`[hanrao] Listening on http://0.0.0.0:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Failed to start HTTP server:", err);
    });
}
