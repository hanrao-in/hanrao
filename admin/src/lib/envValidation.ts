/**
 * Startup environment validation. Fails fast with clear human-readable message if misconfigured.
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const required = [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_ANON_KEY",
  ];

  const missing: string[] = [];

  for (const key of required) {
    if (typeof import.meta !== "undefined" && import.meta.env) {
      if (!import.meta.env[key]) {
        missing.push(key);
      }
    }
  }

  if (missing.length > 0) {
    console.error(`❌ CRITICAL: Missing environment variables: ${missing.join(", ")}`);
  }

  return { valid: missing.length === 0, missing };
}
