// Minimal Node.js HTTP wrapper for TanStack Start / Nitro fetch handler on Render.com
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";

const PORT = parseInt(process.env.PORT || "3000", 10);

// Load the built fetch-handler exported by TanStack Start / Nitro
const { default: app } = await import("./dist/server/server.js");

const MIME_TYPES = {
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
    // Build a WHATWG Request from the Node IncomingMessage
    const proto = req.headers["x-forwarded-proto"] || (req.socket?.encrypted ? "https" : "http");
    const host = req.headers.host || `localhost:${PORT}`;
    const url = `${proto}://${host}${req.url}`;

    // Serve static files from dist/client if they exist
    const urlPath = new URL(url).pathname;
    const clientDir = path.resolve(process.cwd(), "dist/client");
    const filePath = path.resolve(clientDir, urlPath.startsWith("/") ? urlPath.slice(1) : urlPath);

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

    // Stream body for POST/PUT/PATCH
    let body = undefined;
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method || "GET")) {
      body = Readable.toWeb(req);
    }

    const request = new Request(url, {
      method: req.method,
      headers,
      body,
      // @ts-ignore — duplex needed for streaming body
      duplex: "half",
    });

    // Call TanStack Start's fetch handler
    const response = await app.fetch(request, process.env, {});

    res.statusCode = response.status;
    response.headers.forEach((val, key) => res.setHeader(key, val));

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
