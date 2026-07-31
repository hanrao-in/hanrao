import { MongoClient } from "mongodb";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

// ── 1. LOAD ENVIRONMENT VARIABLES MANUALLY ──────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) {
    console.error(
      "Error: .env file not found. Please create one with SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and MONGODB_URI.",
    );
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

const MONGO_URI = process.env.MONGODB_URI;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!MONGO_URI || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing required env variables. Ensure MONGODB_URI, SUPABASE_URL, and SUPABASE_SERVICE_ROLE_KEY are set.",
  );
  process.exit(1);
}

// Initialize clients
const mongoClient = new MongoClient(MONGO_URI);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Helper for storage upload
async function uploadBase64(base64Str: string, bucketName: string): Promise<string> {
  if (!base64Str || !base64Str.startsWith("data:image/")) {
    return base64Str; // Already a URL or empty
  }

  try {
    const match = base64Str.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!match) return base64Str;

    const contentType = match[1];
    const rawData = match[2];
    const buffer = Buffer.from(rawData, "base64");

    let ext = "png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
    else if (contentType.includes("webp")) ext = "webp";
    else if (contentType.includes("svg")) ext = "svg";

    const filePath = `migrated/${randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, { contentType, upsert: true });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    // Catalog in media table
    await supabase.from("media").insert({
      url: publicUrl,
      bucket: bucketName,
      file_path: filePath,
      size_bytes: buffer.length,
      content_type: contentType,
    });

    return publicUrl;
  } catch (err: any) {
    console.warn(`[Storage Warning] Failed to upload image to bucket ${bucketName}:`, err.message);
    return ""; // Return empty or keep as is if it fails
  }
}

async function runMigration() {
  console.log("Connecting to MongoDB...");
  await mongoClient.connect();
  const db = mongoClient.db();

  console.log("Connected. Fetching counts...");
  const mongoCounts = {
    projects: await db.collection("projects").countDocuments(),
    plots: await db.collection("plots").countDocuments(),
    customers: await db.collection("customers").countDocuments(),
    bookings: await db.collection("bookings").countDocuments(),
    enquiries: await db.collection("enquiries").countDocuments(),
    site_visits: await db.collection("site_visits").countDocuments(),
    notifications: await db.collection("notifications").countDocuments(),
  };

  console.log("MongoDB collection sizes:", mongoCounts);

  // 1. PROJECTS
  console.log("\nMigrating Projects...");
  const projects = await db.collection("projects").find().toArray();
  let migratedProjectsCount = 0;
  for (const p of projects) {
    console.log(`Processing Project: ${p.name}`);
    const thumbUrl = await uploadBase64(p.thumbnail_url, "projects");
    const galleryUrls: string[] = [];
    if (p.gallery_urls && Array.isArray(p.gallery_urls)) {
      for (const url of p.gallery_urls) {
        galleryUrls.push(await uploadBase64(url, "projects"));
      }
    }

    const { error } = await supabase.from("projects").insert({
      id: p.id || randomUUID(),
      slug: p.slug,
      name: p.name,
      description: p.description || "",
      district: p.district,
      village: p.village || "",
      city: p.city || "",
      state: p.state || "Telangana",
      thumbnail_url: thumbUrl,
      gallery_urls: galleryUrls,
      map_lat: p.map_lat || null,
      map_lng: p.map_lng || null,
      map_embed_url: p.map_embed_url || null,
      brochure_url: p.brochure_url || null,
      status: p.status || "active",
      approval_types: p.approval_types || [],
      amenities: p.amenities || [],
      nearby: p.nearby || {},
      featured: p.featured || false,
      location_id: p.location_id || null,
      rera_number: p.rera_number || null,
      created_at: p.created_at || new Date().toISOString(),
    });

    if (error) {
      console.error(`Failed to insert project: ${p.name}`, error);
    } else {
      migratedProjectsCount++;
    }
  }

  // 2. PLOTS
  console.log("\nMigrating Plots...");
  const plots = await db.collection("plots").find().toArray();
  let migratedPlotsCount = 0;
  for (const pl of plots) {
    const plotImages: string[] = [];
    if (pl.images && Array.isArray(pl.images)) {
      for (const img of pl.images) {
        plotImages.push(await uploadBase64(img, "plots"));
      }
    }

    const { error } = await supabase.from("plots").insert({
      id: pl.id || randomUUID(),
      project_id: pl.project_id,
      plot_number: pl.plot_number,
      area_sqyd: pl.area_sqyd,
      price_per_sqyd: pl.price_per_sqyd,
      facing: pl.facing || "East",
      plot_type: pl.plot_type || "open",
      availability: pl.availability || "available",
      latitude: pl.latitude || null,
      longitude: pl.longitude || null,
      images: plotImages,
      created_at: pl.created_at || new Date().toISOString(),
    });

    if (error) {
      console.error(`Failed to insert plot: ${pl.plot_number}`, error);
    } else {
      migratedPlotsCount++;
    }
  }

  // 3. ENQUIRIES
  console.log("\nMigrating Enquiries...");
  const enquiries = await db.collection("enquiries").find().toArray();
  let migratedEnquiriesCount = 0;
  for (const enq of enquiries) {
    const { error } = await supabase.from("enquiries").insert({
      id: enq.id || randomUUID(),
      name: enq.name,
      phone: enq.phone,
      email: enq.email || null,
      message: enq.message || null,
      project_id: enq.project_id || null,
      project_name: enq.project_name || null,
      budget: enq.budget || null,
      lead_status: enq.lead_status || "new",
      status: enq.status || "open",
      notes: enq.notes || null,
      interested_plot_id: enq.interested_plot_id || null,
      created_at: enq.created_at || new Date().toISOString(),
    });

    if (error) {
      console.error(`Failed to insert enquiry: ${enq.name}`, error);
    } else {
      migratedEnquiriesCount++;
    }
  }

  // 4. CUSTOMERS
  console.log("\nMigrating Customers...");
  const customers = await db.collection("customers").find().toArray();
  let migratedCustomersCount = 0;
  for (const c of customers) {
    const { error } = await supabase.from("customers").insert({
      id: c.id || randomUUID(),
      name: c.name,
      phone: c.phone,
      email: c.email || null,
      address: c.address || null,
      source: c.source || "website",
      status: c.status || "lead",
      notes: c.notes || null,
      enquiry_id: c.enquiry_id || null,
      created_at: c.created_at || new Date().toISOString(),
    });

    if (error) {
      console.error(`Failed to insert customer: ${c.name}`, error);
    } else {
      migratedCustomersCount++;
    }
  }

  // 5. BOOKINGS
  console.log("\nMigrating Bookings...");
  const bookings = await db.collection("bookings").find().toArray();
  let migratedBookingsCount = 0;
  for (const b of bookings) {
    const { error } = await supabase.from("bookings").insert({
      id: b.id || randomUUID(),
      customer_name: b.customer_name,
      customer_phone: b.customer_phone,
      customer_email: b.customer_email || null,
      project_id: b.project_id || null,
      project_name: b.project_name || null,
      plot_id: b.plot_id || null,
      plot_number: b.plot_number || null,
      total_amount: b.total_amount,
      paid_amount: b.paid_amount || 0,
      status: b.status || "advance",
      booking_date: b.booking_date || new Date().toISOString(),
      notes: b.notes || null,
      created_at: b.created_at || new Date().toISOString(),
    });

    if (error) {
      console.error(`Failed to insert booking for: ${b.customer_name}`, error);
    } else {
      migratedBookingsCount++;
    }
  }

  // 6. SITE VISITS
  console.log("\nMigrating Site Visits...");
  const visits = await db.collection("site_visits").find().toArray();
  let migratedVisitsCount = 0;
  for (const v of visits) {
    const { error } = await supabase.from("site_visits").insert({
      id: v.id || randomUUID(),
      name: v.name,
      phone: v.phone,
      email: v.email || null,
      preferred_date: v.preferred_date,
      preferred_time: v.preferred_time,
      message: v.message || null,
      project_id: v.project_id || null,
      project_name: v.project_name || null,
      status: v.status || "pending",
      created_at: v.created_at || new Date().toISOString(),
    });

    if (error) {
      console.error(`Failed to insert site visit for: ${v.name}`, error);
    } else {
      migratedVisitsCount++;
    }
  }

  // 7. NOTIFICATIONS
  console.log("\nMigrating Notifications...");
  const notifications = await db.collection("notifications").find().toArray();
  let migratedNotificationsCount = 0;
  for (const n of notifications) {
    const { error } = await supabase.from("notifications").insert({
      id: n.id || randomUUID(),
      title: n.title,
      message: n.message,
      type: n.type || "info",
      read: n.read || false,
      entity_type: n.entity_type || null,
      entity_id: n.entity_id || null,
      created_at: n.created_at || new Date().toISOString(),
    });

    if (error) {
      console.error(`Failed to insert notification: ${n.title}`, error);
    } else {
      migratedNotificationsCount++;
    }
  }

  // Fetch PostgreSQL final counts for parity verification
  const getPgCount = async (table: string) => {
    const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
    return error ? 0 : count;
  };

  const pgCounts = {
    projects: await getPgCount("projects"),
    plots: await getPgCount("plots"),
    customers: await getPgCount("customers"),
    bookings: await getPgCount("bookings"),
    enquiries: await getPgCount("enquiries"),
    site_visits: await getPgCount("site_visits"),
    notifications: await getPgCount("notifications"),
  };

  console.log("\n==========================================");
  console.log("MIGRATION PARITY SUMMARY");
  console.log("==========================================");
  console.log("Collection    | MongoDB Count | PostgreSQL Count | Status");
  console.log("------------------------------------------");

  const printLine = (label: string, mongo: number, pg: number) => {
    const status = mongo === pg ? "✅ PARITY MATCH" : "❌ MISMATCH";
    console.log(
      `${label.padEnd(13)} | ${String(mongo).padEnd(13)} | ${String(pg).padEnd(16)} | ${status}`,
    );
  };

  printLine("Projects", mongoCounts.projects, pgCounts.projects || 0);
  printLine("Plots", mongoCounts.plots, pgCounts.plots || 0);
  printLine("Customers", mongoCounts.customers, pgCounts.customers || 0);
  printLine("Bookings", mongoCounts.bookings, pgCounts.bookings || 0);
  printLine("Enquiries", mongoCounts.enquiries, pgCounts.enquiries || 0);
  printLine("Site Visits", mongoCounts.site_visits, pgCounts.site_visits || 0);
  printLine("Notifications", mongoCounts.notifications, pgCounts.notifications || 0);
  console.log("==========================================");

  // Write audit log entry of the migration
  await supabase.from("audit_logs").insert({
    action: "data_migration",
    details: {
      mongo_counts: mongoCounts,
      pg_counts: pgCounts,
      timestamp: new Date().toISOString(),
    },
  });

  console.log("Closing MongoDB connection...");
  await mongoClient.close();
  console.log("Migration complete!");
}

runMigration().catch((err) => {
  console.error("Catastrophic migration error:", err);
  mongoClient.close().catch(() => {});
});
