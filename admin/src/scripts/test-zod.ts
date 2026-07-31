import { z } from "zod";

const projectSchema = z.object({
  slug: z.string().trim().min(1).max(200),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  district: z.string().trim().max(100),
  village: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(100),
  state: z.string().trim().max(100).default("Telangana"),
  status: z.enum(["active", "upcoming", "sold_out"]).default("active"),
  featured: z.boolean().default(false),
  thumbnail_url: z.string().trim().optional().or(z.literal("")),
  approval_types: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  gallery_urls: z.array(z.string()).default([]),
  brochure_url: z.string().trim().optional().or(z.literal("")),
  location_link: z.string().trim().optional().or(z.literal("")),
  rera_number: z.string().trim().optional().or(z.literal("")),
});

const payload = {
  data: {
    slug: "test-project",
    name: "Test Project",
    district: "Hyderabad",
    city: "Hyderabad",
  }
};

try {
  console.log("Parsing payload with projectSchema directly...");
  projectSchema.parse(payload);
  console.log("Successfully parsed!");
} catch (e: any) {
  console.error("Failed to parse directly:", e.message);
}

try {
  console.log("\nParsing nested payload (d => projectSchema.parse(d.data || d))...");
  const parseFn = (d: any) => projectSchema.parse(d.data || d);
  parseFn(payload);
  console.log("Successfully parsed nested!");
} catch (e: any) {
  console.error("Failed to parse nested:", e.message);
}
