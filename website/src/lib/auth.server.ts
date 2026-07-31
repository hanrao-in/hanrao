import { getRequest } from "@tanstack/react-start/server";
import { createHmac, timingSafeEqual } from "node:crypto";

const SECRET =
  process.env.SESSION_SECRET ||
  process.env.JWT_SECRET ||
  "hanrao-prime-portal-dev-secret-key-32bytes!";

export function signSession(email: string): string {
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  const payload = JSON.stringify({ email, expiresAt });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${encodedPayload}.${signature}`;
}

export function verifySessionToken(token: string): { email: string } | null {
  try {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;
    const payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const expectedSignature = createHmac("sha256", SECRET).update(payload).digest("hex");

    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const data = JSON.parse(payload);
    if (typeof data.expiresAt === "number" && Date.now() > data.expiresAt) return null;

    return { email: data.email };
  } catch {
    return null;
  }
}

// Memory-based rate limiter map (can be swapped for Redis in distributed setups)
const loginAttemptsMap = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(ip: string): void {
  const currentTime = Date.now();
  const entry = loginAttemptsMap.get(ip);
  if (entry) {
    if (currentTime > entry.resetAt) {
      loginAttemptsMap.set(ip, { count: 1, resetAt: currentTime + 15 * 60 * 1000 });
      return;
    }
    if (entry.count >= 5) {
      throw new Error("Too many failed login attempts. Please try again after 15 minutes.");
    }
    entry.count += 1;
    loginAttemptsMap.set(ip, entry);
  } else {
    loginAttemptsMap.set(ip, { count: 1, resetAt: currentTime + 15 * 60 * 1000 });
  }
}

export function verifyAdminAuth(): { email: string } {
  const request = getRequest();
  if (!request) throw new Error("Unauthorized: Server context unavailable");

  // CSRF Validation: Verify Origin/Referer matching host
  const host = request.headers.get("host") ?? "";
  const origin = request.headers.get("origin") ?? "";
  const referer = request.headers.get("referer") ?? "";

  const targetOrigin = process.env.APP_ORIGIN;
  if (origin) {
    const isHostMatch = host && origin.includes(host);
    const isEnvMatch = targetOrigin && origin.startsWith(targetOrigin);
    if (!isHostMatch && !isEnvMatch) {
      throw new Error("Forbidden: CSRF Origin mismatch");
    }
  } else if (referer) {
    const isHostMatch = host && referer.includes(host);
    const isEnvMatch = targetOrigin && referer.startsWith(targetOrigin);
    if (!isHostMatch && !isEnvMatch) {
      throw new Error("Forbidden: CSRF Referer mismatch");
    }
  }

  // Parse admin_session cookie or Authorization header
  const cookieHeader = request.headers.get("cookie") ?? "";
  const authHeader = request.headers.get("authorization") ?? "";

  let token: string | null = null;
  const match = cookieHeader.match(/admin_session=([^;]+)/);
  if (match) {
    token = match[1];
  } else if (authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  if (!token) {
    throw new Error("Unauthorized: Missing admin session token");
  }

  const session = verifySessionToken(token);
  if (!session) {
    throw new Error("Unauthorized: Invalid or expired admin session token");
  }

  return session;
}

export function validateBase64Image(dataUri?: string): void {
  if (!dataUri || !dataUri.trim()) return;
  if (!dataUri.startsWith("data:image/")) {
    if (dataUri.startsWith("http://") || dataUri.startsWith("https://")) {
      if (dataUri.length > 2000) throw new Error("Image URL exceeds 2000 characters limit");
      return;
    }
    throw new Error("Invalid image format: Must be an HTTP(S) URL or base64 data:image/");
  }
  const sizeInBytes = (dataUri.length * 3) / 4;
  if (sizeInBytes > 10 * 1024 * 1024) {
    throw new Error("Base64 image payload size exceeds maximum 10MB limit");
  }
}
