import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ProjectService } from "./services/project.service";
import { CustomerService } from "./services/customer.service";
import { AuthService } from "./services/auth.service";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Project, Plot, Location, ProjectWithPlots } from "./types";

const projectService = new ProjectService();
const customerService = new CustomerService();
const authService = new AuthService();

const mockToPublic = (p: any): Project =>
  ({
    ...p,
    village: "",
    gallery_urls: [],
    brochure_url: "",
    rera_number: "",
    location_link: "",
  }) as unknown as Project;

const sanitizeProject = (p: Project): Project => {
  let cleanSlug = (p.slug || "").trim();
  if (!cleanSlug || cleanSlug.startsWith("http://") || cleanSlug.startsWith("https://")) {
    cleanSlug = (p.name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  return { ...p, slug: cleanSlug };
};

// ══════════════════════════════════════════════════════════════════════════════
// PUBLIC SERVER FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

export const listProjects = createServerFn({ method: "GET" }).handler(
  async (): Promise<Project[]> => {
    try {
      const list = await projectService.listProjects();
      return list.map(sanitizeProject);
    } catch (err: any) {
      console.warn(
        "[Database Warning] Missing schema or tables. Falling back to local mockDb...",
        err.message,
      );
      const { db: mockDb } = await import("./mockDb");
      return mockDb.projects.list().map(mockToPublic).map(sanitizeProject);
    }
  },
);

export const listFeaturedProjects = createServerFn({ method: "GET" }).handler(
  async (): Promise<Project[]> => {
    try {
      const list = await projectService.listFeaturedProjects(6);
      return list.map(sanitizeProject);
    } catch (err: any) {
      console.warn(
        "[Database Warning] Missing schema or tables. Falling back to local mockDb...",
        err.message,
      );
      const { db: mockDb } = await import("./mockDb");
      return mockDb.projects
        .list()
        .filter((p) => p.featured)
        .map(mockToPublic)
        .map(sanitizeProject);
    }
  },
);

export const getProjectBySlug = createServerFn({ method: "GET" })
  .validator((d) => z.object({ slug: z.string().min(1).max(500) }).parse(d))
  .handler(async ({ data }): Promise<ProjectWithPlots | null> => {
    try {
      const project = await projectService.getProjectBySlug(data.slug);
      if (!project) return null;

      const plots = await projectService.listPlotsByProject(project.id);
      return {
        ...sanitizeProject(project),
        plots,
      };
    } catch (err: any) {
      console.warn(
        "[Database Warning] Missing schema or tables. Falling back to local mockDb...",
        err.message,
      );
      const { db: mockDb } = await import("./mockDb");
      const p = mockDb.projects.list().find((x) => x.slug === data.slug || x.id === data.slug);
      if (!p) return null;
      const plots = mockDb.plots.list().filter((x) => x.project_id === p.id);
      return {
        ...sanitizeProject(mockToPublic(p)),
        plots: plots as unknown as Plot[],
      } as ProjectWithPlots;
    }
  });

export const searchProjects = createServerFn({ method: "GET" })
  .validator((d) =>
    z
      .object({
        q: z.string().max(120).optional().default(""),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
        minArea: z.number().optional(),
        maxArea: z.number().optional(),
        plotType: z.enum(["open", "villa", "commercial", "farm"]).optional(),
        approval: z.enum(["DTCP", "HMDA", "RERA"]).optional(),
        sort: z.enum(["newest", "price_asc", "price_desc", "area"]).optional().default("newest"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    try {
      // 1. Fetch matching projects
      let query = supabaseAdmin.from("projects").select("*");

      if (data.q?.trim()) {
        const qClean = `%${data.q.trim()}%`;
        query = query.or(
          `name.ilike.${qClean},village.ilike.${qClean},city.ilike.${qClean},district.ilike.${qClean},description.ilike.${qClean}`,
        );
      }

      if (data.approval) {
        query = query.contains("approval_types", [data.approval]);
      }

      const { data: projects, error: pErr } = await query;
      if (pErr) throw pErr;
      if (!projects || projects.length === 0) return [];

      const ids = projects.map((p) => p.id);

      // 2. Fetch corresponding plots
      let plotQuery = supabaseAdmin
        .from("plots")
        .select("*")
        .in("project_id", ids)
        .neq("availability", "sold");

      if (data.plotType) {
        plotQuery = plotQuery.eq("plot_type", data.plotType);
      }
      if (data.minArea !== undefined) {
        plotQuery = plotQuery.gte("area_sqyd", data.minArea);
      }
      if (data.maxArea !== undefined) {
        plotQuery = plotQuery.lte("area_sqyd", data.maxArea);
      }
      if (data.minPrice !== undefined) {
        plotQuery = plotQuery.gte("price_per_sqyd", data.minPrice);
      }
      if (data.maxPrice !== undefined) {
        plotQuery = plotQuery.lte("price_per_sqyd", data.maxPrice);
      }

      const { data: plots, error: plErr } = await plotQuery;
      if (plErr) throw plErr;

      // Group plots by project_id
      const plotsByProject = new Map<string, typeof plots>();
      for (const plot of plots || []) {
        const arr = plotsByProject.get(plot.project_id) ?? [];
        arr.push(plot);
        plotsByProject.set(plot.project_id, arr);
      }

      const enriched = projects
        .map((proj) => {
          const pl = plotsByProject.get(proj.id) ?? [];
          const availablePlots = pl.filter((p) => p.availability === "available");
          const minPrice = pl.length ? Math.min(...pl.map((p) => Number(p.price_per_sqyd))) : 0;
          const totalArea = pl.reduce((s, p) => s + Number(p.area_sqyd), 0);
          return {
            ...sanitizeProject(proj as any),
            _plotCount: pl.length,
            _availableCount: availablePlots.length,
            _minPrice: minPrice,
            _totalArea: totalArea,
            _plotImages: pl.flatMap((p) => p.images || []).slice(0, 4),
          };
        })
        .filter(
          (p) =>
            !(data.plotType || data.minArea || data.maxArea || data.minPrice || data.maxPrice) ||
            p._plotCount > 0,
        );

      switch (data.sort) {
        case "price_asc":
          enriched.sort((a, b) => a._minPrice - b._minPrice);
          break;
        case "price_desc":
          enriched.sort((a, b) => b._minPrice - a._minPrice);
          break;
        case "area":
          enriched.sort((a, b) => b._totalArea - a._totalArea);
          break;
        default:
          enriched.sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          );
      }

      return enriched;
    } catch (err: any) {
      console.warn(
        "[Database Warning] Missing schema or tables. Returning empty search results...",
        err.message,
      );
      return [];
    }
  });

export const listLocations = createServerFn({ method: "GET" }).handler(
  async (): Promise<Location[]> => {
    try {
      const { data, error } = await supabaseAdmin
        .from("projects")
        .select("village, city, district, state");

      if (error) throw error;
      if (!data) return [];

      const seen = new Set<string>();
      const locations: Location[] = [];

      for (const d of data) {
        for (const [type, name] of [
          ["village", d.village],
          ["city", d.city],
          ["district", d.district],
        ] as const) {
          if (name && !seen.has(name)) {
            seen.add(name);
            locations.push({
              id: name,
              name,
              type: type as Location["type"],
              state: d.state ?? "Telangana",
            });
          }
        }
      }

      return locations.sort((a, b) => a.name.localeCompare(b.name));
    } catch (err: any) {
      console.warn(
        "[Database Warning] Missing schema or tables. Returning empty locations...",
        err.message,
      );
      return [];
    }
  },
);

// ══════════════════════════════════════════════════════════════════════════════
// SUBMISSIONS
// ══════════════════════════════════════════════════════════════════════════════

const enquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  message: z.string().trim().max(2000).optional(),
  project_id: z.string().uuid().optional(),
  project_name: z.string().trim().max(200).optional(),
  budget: z.string().trim().max(100).optional(),
  source: z.enum(["website", "call", "whatsapp", "walk-in"]).default("website"),
});

export const submitEnquiry = createServerFn({ method: "POST" })
  .validator((d) => enquirySchema.parse(d))
  .handler(async ({ data }) => {
    authService.validateCSRF();
    if (!data.name || !data.phone) throw new Error("Name and phone are required.");
    await customerService.submitEnquiry(data as any);
    return { ok: true };
  });

const siteVisitSchema = z.object({
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(6).max(20),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  preferred_time: z.string().min(1).max(40),
  message: z.string().trim().max(2000).optional(),
  project_id: z.string().uuid().optional(),
  project_name: z.string().trim().max(200).optional(),
});

export const submitSiteVisit = createServerFn({ method: "POST" })
  .validator((d) => siteVisitSchema.parse(d))
  .handler(async ({ data }) => {
    authService.validateCSRF();
    if (!data.name || !data.phone) throw new Error("Name and phone are required.");
    if (!data.preferred_date) throw new Error("Preferred date is required.");

    // Submit site visit using supabaseAdmin
    const { data: sv, error: svErr } = await supabaseAdmin
      .from("site_visits")
      .insert({
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        preferred_date: data.preferred_date,
        preferred_time: data.preferred_time,
        message: data.message || null,
        project_id: data.project_id || null,
        project_name: data.project_name || null,
        status: "pending",
      })
      .select()
      .single();

    if (svErr) throw svErr;

    // Create Notification
    await supabaseAdmin.from("notifications").insert({
      title: "Site Visit Requested",
      message: `${data.name} requested a site visit on ${data.preferred_date}.`,
      type: "info",
      read: false,
      entity_type: "site_visit",
      entity_id: sv.id,
    });

    return { ok: true };
  });
