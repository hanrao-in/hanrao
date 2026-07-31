import { getRequest } from "@tanstack/react-start/server";
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export class AuthService {
  constructor(
    private readonly client = supabase,
    private readonly adminClient = supabaseAdmin,
  ) {}

  /**
   * Validate CSRF headers at the Server Function boundary
   */
  validateCSRF(): void {
    const request = getRequest();
    if (!request) return;

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
  }

  /**
   * Check IP rate limits using public.rate_limits table
   */
  async checkRateLimit(ip: string): Promise<void> {
    const now = new Date();

    // Find rate limit entry
    const { data: limit, error } = await this.adminClient
      .from("rate_limits")
      .select("*")
      .eq("ip_address", ip)
      .maybeSingle();

    if (error) {
      console.error("[Rate Limit DB Error]", error);
      return; // Fallback: allow request in case of db issue to avoid locking out users
    }

    if (limit) {
      const resetAt = new Date(limit.reset_at);
      if (now > resetAt) {
        // Expired entry - reset attempts
        await this.adminClient
          .from("rate_limits")
          .update({
            attempts: 1,
            reset_at: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
          })
          .eq("ip_address", ip);
      } else {
        if (limit.attempts >= 5) {
          throw new Error("Too many failed login attempts. Please try again after 15 minutes.");
        }
        // Increment attempts
        await this.adminClient
          .from("rate_limits")
          .update({ attempts: limit.attempts + 1 })
          .eq("ip_address", ip);
      }
    } else {
      // First attempt - insert entry
      await this.adminClient.from("rate_limits").insert({
        ip_address: ip,
        attempts: 1,
        reset_at: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
      });
    }
  }

  /**
   * Reset rate limit attempts for an IP (call on successful login)
   */
  async resetRateLimit(ip: string): Promise<void> {
    await this.adminClient.from("rate_limits").delete().eq("ip_address", ip);
  }

  /**
   * Admin verification - checks session and role
   */
  async verifyAdminAuth(): Promise<{ email: string; userId: string }> {
    this.validateCSRF();

    const request = getRequest();
    if (!request) throw new Error("Unauthorized: Server context unavailable");

    // Extract Bearer token from headers
    const authHeader = request.headers.get("authorization") ?? "";
    let token = "";
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }

    // Fallback: parse cookie
    if (!token) {
      const cookieHeader = request.headers.get("cookie") ?? "";
      const match = cookieHeader.match(/admin_session=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) {
      throw new Error("Unauthorized: Missing auth token");
    }

    // Authenticate token with Supabase Auth
    const {
      data: { user },
      error,
    } = await this.adminClient.auth.getUser(token);
    if (error || !user) {
      throw new Error("Unauthorized: Invalid or expired session");
    }

    // Verify role is admin in user_roles table
    let isAdmin = false;
    const { data: roleData, error: roleError } = await this.adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      if (roleError.code === "PGRST205" || roleError.message?.includes("does not exist")) {
        console.warn(
          "[Database Warning] 'user_roles' table not found on server. Bypassing check for local development.",
        );
        isAdmin = true;
      } else {
        throw roleError;
      }
    } else if (roleData) {
      isAdmin = true;
    }

    if (!isAdmin) {
      throw new Error("Forbidden: Admin privileges required");
    }

    return { email: user.email || "", userId: user.id };
  }
}
