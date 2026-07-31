import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";

// Load Environment variables from .env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error("Error: .env file not found.");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const firstEquals = trimmed.indexOf("=");
    if (firstEquals === -1) return;
    const key = trimmed.substring(0, firstEquals).trim();
    const value = trimmed
      .substring(firstEquals + 1)
      .replace(/^['"]|['"]$/g, "")
      .trim();
    process.env[key] = value;
  });
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const VITE_SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log("=== SUPABASE CONFIGURATION DIAGNOSTICS ===");
console.log(
  "SUPABASE_URL:",
  SUPABASE_URL ? "CONFIGURED (starts with " + SUPABASE_URL.substring(0, 15) + ")" : "MISSING",
);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY:",
  SUPABASE_SERVICE_ROLE_KEY
    ? "CONFIGURED (starts with " + SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + ")"
    : "MISSING",
);
console.log(
  "VITE_SUPABASE_URL:",
  VITE_SUPABASE_URL
    ? "CONFIGURED (starts with " + VITE_SUPABASE_URL.substring(0, 15) + ")"
    : "MISSING",
);
console.log(
  "VITE_SUPABASE_PUBLISHABLE_KEY:",
  VITE_SUPABASE_PUBLISHABLE_KEY
    ? "CONFIGURED (starts with " + VITE_SUPABASE_PUBLISHABLE_KEY.substring(0, 15) + ")"
    : "MISSING",
);
console.log("=========================================\n");

async function runDiagnostics() {
  if (
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY ||
    !VITE_SUPABASE_URL ||
    !VITE_SUPABASE_PUBLISHABLE_KEY
  ) {
    console.error("Diagnostic aborted: Missing configuration keys in .env");
    process.exit(1);
  }

  // 1. Initialize Server Admin Client
  console.log("1. Initializing Server-Side Admin Client...");
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  console.log("✔ Admin Client Initialized.");

  // 2. Initialize Browser/Client Client
  console.log("2. Initializing Browser Client...");
  const browserClient = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  console.log("✔ Browser Client Initialized.");

  // 3. Test Authentication API Connectivity (Server Client)
  console.log("3. Testing Server Auth initialization...");
  try {
    const { data: authData, error: authError } = await adminClient.auth.getSession();
    if (authError) throw authError;
    console.log("✔ Server Auth API connected successfully.");
  } catch (err: any) {
    console.error("✖ Server Auth error:", err.message);
  }

  // 4. Test Authentication API Connectivity (Browser Client)
  console.log("4. Testing Browser Auth initialization...");
  try {
    const { data: authData, error: authError } = await browserClient.auth.getSession();
    if (authError) throw authError;
    console.log("✔ Browser Auth API connected successfully.");
  } catch (err: any) {
    console.error("✖ Browser Auth error:", err.message);
  }

  // 5. Test Database Connectivity (Projects table check)
  console.log("5. Testing Database connectivity (projects select)...");
  try {
    const { data, error } = await adminClient.from("projects").select("id, name").limit(1);
    if (error) throw error;
    console.log(
      `✔ Database connected. Successfully fetched projects. Records found: ${data?.length}`,
    );
  } catch (err: any) {
    console.error("✖ Database query error:", err.message);
  }

  // 6. Test Storage Connectivity (List buckets check)
  console.log("6. Testing Storage connectivity (list buckets)...");
  try {
    const { data, error } = await adminClient.storage.listBuckets();
    if (error) throw error;
    console.log(
      "✔ Storage connected successfully. Buckets found:",
      data.map((b) => b.name).join(", "),
    );
  } catch (err: any) {
    console.error("✖ Storage query error:", err.message);
  }

  console.log("\nDiagnostics Complete.");
}

runDiagnostics();
