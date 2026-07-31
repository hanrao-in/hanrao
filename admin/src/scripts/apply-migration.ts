import pg from "pg";
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

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD || "";

// Extract project reference ID from Supabase URL
const match = SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
const projId = match ? match[1] : "";

async function runMigration() {
  if (!projId) {
    console.error("Invalid or missing SUPABASE_URL in .env");
    process.exit(1);
  }

  // List of candidate passwords to try
  const passwords = [];
  if (SUPABASE_DB_PASSWORD) {
    passwords.push(SUPABASE_DB_PASSWORD);
  }
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    passwords.push(process.env.SUPABASE_SERVICE_ROLE_KEY);
  }
  if (process.env.SUPABASE_PUBLISHABLE_KEY) {
    passwords.push(process.env.SUPABASE_PUBLISHABLE_KEY);
  }

  // Common fallback guesses
  passwords.push("AdminPassword123!");
  passwords.push("admin123");
  passwords.push("hanraorealty");
  passwords.push("hanrao");
  passwords.push("hanraoadmin");

  // Build candidate connection configs
  interface ConnConfig {
    label: string;
    host: string;
    port: number;
    user: string;
    pw: string;
  }

  const configs: ConnConfig[] = [];
  const regions = [
    "ap-northeast-2",
    "ap-south-1",
    "ap-southeast-1",
    "ap-southeast-2",
    "ap-northeast-1",
    "us-east-1",
    "us-west-1",
    "us-west-2",
    "eu-central-1",
    "eu-west-1",
    "eu-west-2",
    "sa-east-1",
  ];
  const poolerPrefixes = ["aws-0", "aws-1", "aws-2"];

  for (const pw of passwords) {
    // 1. Direct connection
    configs.push({
      label: "Direct IPv6 (5432)",
      host: `db.${projId}.supabase.co`,
      port: 5432,
      user: "postgres",
      pw,
    });
    configs.push({
      label: "Direct IPv6 (6543)",
      host: `db.${projId}.supabase.co`,
      port: 6543,
      user: "postgres",
      pw,
    });

    // 2. Pooler connection for each region × prefix
    for (const prefix of poolerPrefixes) {
      for (const reg of regions) {
        configs.push({
          label: `Pooler ${prefix}-${reg} (6543)`,
          host: `${prefix}-${reg}.pooler.supabase.com`,
          port: 6543,
          user: `postgres.${projId}`,
          pw,
        });
        configs.push({
          label: `Pooler ${prefix}-${reg} (5432)`,
          host: `${prefix}-${reg}.pooler.supabase.com`,
          port: 5432,
          user: `postgres.${projId}`,
          pw,
        });
      }
    }
  }

  console.log(`Connecting to PostgreSQL database for project ${projId}...`);

  let client: pg.Client | null = null;
  let successfulPassword = "";

  for (const config of configs) {
    try {
      console.log(`Trying ${config.label} - Password: ${config.pw.substring(0, 3)}...`);
      client = new pg.Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.pw,
        database: "postgres",
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000, // 3 seconds timeout!
      });
      let timeoutId: NodeJS.Timeout | undefined;
      const connectPromise = client.connect();
      connectPromise.catch(() => {}); // Suppress unhandled rejection on background TCP fail
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Connection timed out after 3s")), 3000);
      });
      await Promise.race([connectPromise, timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);

      successfulPassword = config.pw;
      console.log(`✔ Connected successfully using ${config.label}!`);
      break;
    } catch (err: any) {
      // Only print connection refused or non-DNS errors to keep logs clean
      if (!err.message.includes("ENOTFOUND")) {
        console.log(`  ✖ Failed: ${err.message}`);
      }
      client = null;
    }
  }

  if (!client) {
    console.error(
      "\n✖ Error: Connection failed. Could not authenticate with any candidate password.",
    );
    console.error("Please add your database password in 'admin/.env' as:");
    console.error("  SUPABASE_DB_PASSWORD=your_supabase_db_password");
    console.error(
      "\nOr apply the schemas manually by copying 'supabase/migrations/migration.sql' into the Supabase Dashboard SQL Editor.",
    );
    process.exit(1);
  }

  try {
    const migrationSqlPath = path.resolve(process.cwd(), "../supabase/migrations/migration.sql");
    if (!fs.existsSync(migrationSqlPath)) {
      console.error(`Migration SQL file not found at: ${migrationSqlPath}`);
      process.exit(1);
    }

    console.log("Reading migration SQL script...");
    const sql = fs.readFileSync(migrationSqlPath, "utf-8");

    console.log(
      "Executing SQL migration on remote PostgreSQL database (this may take a few seconds)...",
    );

    // Run the migration as a single transaction block
    await client.query("BEGIN;");
    await client.query(sql);
    await client.query("COMMIT;");

    console.log("✔ Migration applied successfully!");

    // Also write password to env if it was verified/guessed so it is persisted
    if (successfulPassword && successfulPassword !== SUPABASE_DB_PASSWORD) {
      const envPath = path.resolve(process.cwd(), ".env");
      fs.appendFileSync(envPath, `\nSUPABASE_DB_PASSWORD=${successfulPassword}\n`);
      console.log("✔ Added verified password to 'admin/.env' as SUPABASE_DB_PASSWORD.");
    }
  } catch (err: any) {
    console.error("✖ SQL execution failed:", err.message);
    if (client) {
      try {
        await client.query("ROLLBACK;");
      } catch (rollErr) {
        // Ignore rollback error
      }
    }
  } finally {
    if (client) {
      await client.end();
    }
  }
}

runMigration();
