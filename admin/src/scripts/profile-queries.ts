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
const match = SUPABASE_URL.match(/https:\/\/([a-z0-9]+)\.supabase\.co/);
const projId = match ? match[1] : "";

async function runQueryProfiling() {
  if (!projId) {
    console.error("Invalid or missing SUPABASE_URL in .env");
    process.exit(1);
  }

  const passwords = [SUPABASE_DB_PASSWORD, process.env.SUPABASE_SERVICE_ROLE_KEY || "", "bpnDbda16XR3WjU7"].filter(Boolean);
  const regions = ["ap-south-1", "ap-southeast-1", "us-east-1", "eu-central-1"];
  const poolerPrefixes = ["aws-0", "aws-1"];

  interface ConnConfig {
    label: string;
    host: string;
    port: number;
    user: string;
    pw: string;
  }

  const configs: ConnConfig[] = [];
  for (const pw of passwords) {
    configs.push({
      label: `Direct db.${projId}.supabase.co (5432)`,
      host: `db.${projId}.supabase.co`,
      port: 5432,
      user: "postgres",
      pw,
    });
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

  let client: pg.Client | null = null;
  console.log("Connecting to PostgreSQL database for query profiling...");

  for (const config of configs) {
    try {
      client = new pg.Client({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.pw,
        database: "postgres",
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000,
      });
      let timeoutId: NodeJS.Timeout | undefined;
      const connectPromise = client.connect();
      connectPromise.catch(() => {});
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Connection timeout")), 3000);
      });
      await Promise.race([connectPromise, timeoutPromise]);
      if (timeoutId) clearTimeout(timeoutId);

      console.log(`✔ Connected to database via ${config.label}!`);
      break;
    } catch (err: any) {
      client = null;
    }
  }

  if (!client) {
    console.error("✖ Could not connect to PostgreSQL via direct or pooler hosts.");
    process.exit(1);
  }

  const queries = [
    { name: "List Projects", sql: "EXPLAIN ANALYZE SELECT * FROM public.projects WHERE deleted_at IS NULL ORDER BY created_at DESC;" },
    { name: "Find Project By Slug", sql: "EXPLAIN ANALYZE SELECT * FROM public.projects WHERE slug = 'hanrao-prime-meadows' LIMIT 1;" },
    { name: "List Plots With Project Join", sql: "EXPLAIN ANALYZE SELECT plots.*, projects.name as project_name FROM public.plots LEFT JOIN public.projects ON plots.project_id = projects.id ORDER BY plots.plot_number ASC;" },
    { name: "List Plots By Project ID", sql: "EXPLAIN ANALYZE SELECT plots.*, projects.name as project_name FROM public.plots LEFT JOIN public.projects ON plots.project_id = projects.id WHERE plots.project_id = 'a7b311fa-c48f-4318-8f83-3c9215ef8211' ORDER BY plots.plot_number ASC;" },
    { name: "List Customers", sql: "EXPLAIN ANALYZE SELECT * FROM public.customers ORDER BY created_at DESC;" },
    { name: "List Bookings", sql: "EXPLAIN ANALYZE SELECT * FROM public.bookings ORDER BY created_at DESC;" },
    { name: "List Enquiries", sql: "EXPLAIN ANALYZE SELECT * FROM public.enquiries ORDER BY created_at DESC;" },
    { name: "List Site Visits", sql: "EXPLAIN ANALYZE SELECT * FROM public.site_visits ORDER BY created_at DESC;" },
    { name: "List Notifications", sql: "EXPLAIN ANALYZE SELECT * FROM public.notifications ORDER BY created_at DESC;" },
    { name: "Dashboard Projects Count", sql: "EXPLAIN ANALYZE SELECT count(*) FROM public.projects WHERE deleted_at IS NULL;" },
    { name: "Dashboard Plots Availability", sql: "EXPLAIN ANALYZE SELECT availability FROM public.plots;" },
    { name: "Dashboard Bookings Revenue", sql: "EXPLAIN ANALYZE SELECT status, paid_amount FROM public.bookings;" },
  ];

  let outputMd = "# Database Query Profiling Report (EXPLAIN ANALYZE)\n\n";
  outputMd += `**Generated At:** ${new Date().toISOString()}\n\n`;

  for (const q of queries) {
    try {
      const res = await client.query(q.sql);
      const planLines = res.rows.map((r: any) => r["QUERY PLAN"]).join("\n");
      outputMd += `### ${q.name}\n\`\`\`sql\n${q.sql}\n\`\`\`\n\`\`\`text\n${planLines}\n\`\`\`\n\n`;
      console.log(`✔ Profiled: ${q.name}`);
    } catch (e: any) {
      outputMd += `### ${q.name}\n\`\`\`sql\n${q.sql}\n\`\`\`\n**Error:** ${e.message}\n\n`;
      console.error(`✖ Error profiling ${q.name}: ${e.message}`);
    }
  }

  await client.end();

  const outputPath = path.resolve(
    "C:/Users/vinay/.gemini/antigravity-ide/brain/440be80c-1361-4e38-8559-7c56e32a8351/query_analysis.md"
  );
  fs.writeFileSync(outputPath, outputMd, "utf-8");
  console.log(`\n🎉 Query Analysis saved to: ${outputPath}`);
}

runQueryProfiling().catch(console.error);
