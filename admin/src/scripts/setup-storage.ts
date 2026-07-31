import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";

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

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

async function setupBuckets() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_SERVICE_ROLE_KEY),
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const buckets = [
    { name: "projects", public: true },
    { name: "plots", public: true },
    { name: "avatars", public: true },
    { name: "documents", public: false },
  ];

  console.log("Checking and provisioning storage buckets in Supabase...");

  try {
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) throw listError;

    const existingNames = new Set(existingBuckets.map((b) => b.name));

    for (const bucket of buckets) {
      if (existingNames.has(bucket.name)) {
        console.log(`✔ Bucket '${bucket.name}' already exists.`);
      } else {
        console.log(`Creating bucket '${bucket.name}' (public: ${bucket.public})...`);
        const { error: createError } = await supabase.storage.createBucket(bucket.name, {
          public: bucket.public,
          allowedMimeTypes:
            bucket.name === "documents"
              ? ["application/pdf", "image/jpeg", "image/png", "image/webp"]
              : ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"],
          fileSizeLimit: 10 * 1024 * 1024, // 10MB
        });

        if (createError) {
          console.error(`✖ Failed to create bucket '${bucket.name}':`, createError.message);
        } else {
          console.log(`✔ Successfully created bucket '${bucket.name}'.`);
        }
      }
    }
  } catch (err: any) {
    console.error("✖ Storage bucket setup failed:", err.message);
  }
}

setupBuckets();
