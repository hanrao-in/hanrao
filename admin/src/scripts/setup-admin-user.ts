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

async function setupAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  // Initialize client exactly like client.server.ts
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_SERVICE_ROLE_KEY),
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const email = "hanraoadmin@gmail.com";
  const password = "AdminPassword123!";

  console.log(`Creating user ${email} via Supabase Admin Auth API...`);

  try {
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const existingUser = userList.users.find((u) => u.email === email);
    let userId = "";

    if (existingUser) {
      console.log(`✔ User ${email} already exists (ID: ${existingUser.id}).`);
      userId = existingUser.id;
    } else {
      const { data: userData, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (createError) throw createError;
      console.log(`✔ Successfully created user (ID: ${userData.user.id}).`);
      userId = userData.user.id;
    }

    console.log(`Ensuring profile record exists in public.profiles for User ID: ${userId}...`);
    const { error: profileErr } = await supabase.from("profiles").upsert({
      id: userId,
      email: email,
      full_name: "Admin",
    });

    if (profileErr) {
      console.warn("  ⚠ Profile creation warning:", profileErr.message);
    }

    console.log(`Attempting to assign 'admin' role to User ID: ${userId} in public.user_roles...`);
    const { error: roleError } = await supabase.from("user_roles").upsert({
      user_id: userId,
      role: "admin",
    });

    if (roleError) {
      if (roleError.message.includes("does not exist")) {
        console.warn("\n⚠ Warning: The 'user_roles' table does not exist in your database yet.");
        console.warn(
          "Please copy and paste the contents of 'supabase/migrations/migration.sql' into the Supabase SQL Editor first, then run this script again.",
        );
      } else {
        throw roleError;
      }
    } else {
      console.log(`✔ Successfully assigned 'admin' role to ${email}.`);
    }
  } catch (err: any) {
    console.error("✖ Setup failed:", err.message);
  }
}

setupAdmin();
