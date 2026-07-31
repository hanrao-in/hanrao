import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { ProjectService } from "./services/project.service";
import { CustomerService } from "./services/customer.service";
import { AuthService } from "./services/auth.service";
import { AuditRepository } from "./repositories/audit.repository";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Project, Plot, Enquiry, SiteVisit, Booking, Customer, Notification } from "./mockDb";

// Instantiate Services for the server context
const projectService = new ProjectService();
const customerService = new CustomerService();
const authService = new AuthService();
const auditRepo = new AuditRepository();

const getClientIp = (): string => {
  const request = getRequest();
  return request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown-ip";
};

// ══════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ══════════════════════════════════════════════════════════════════════════════

export const projectSchema = z.object({
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

export const plotSchema = z.object({
  project_id: z.string().min(1),
  project_name: z.string().trim().min(1).max(200),
  plot_number: z.string().trim().min(1).max(100),
  area_sqyd: z.number().min(1),
  price_per_sqyd: z.number().min(1),
  facing: z.string().trim().max(50).default("East"),
  plot_type: z.enum(["open", "villa", "commercial", "farm"]).default("open"),
  availability: z.enum(["available", "reserved", "sold"]).default("available"),
  images: z.array(z.string()).default([]),
});

export const bookingSchema = z.object({
  customer_name: z.string().trim().min(1).max(200),
  customer_phone: z.string().trim().min(6).max(20),
  project_name: z.string().trim().max(200).optional(),
  plot_number: z.string().trim().max(100).optional(),
  total_amount: z.number(),
  paid_amount: z.number(),
  status: z.string(),
  booking_date: z.string(),
});

export const customerSchema = z.object({
  name: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(6).max(20),
  email: z
    .string()
    .trim()
    .email()
    .max(255)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  address: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  source: z.string().default("website"),
  status: z.string().default("lead"),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN AUTH RATE LIMIT check
// ══════════════════════════════════════════════════════════════════════════════

export const checkLoginRateLimit = createServerFn({ method: "POST" })
  .validator((d) => z.object({ ip: z.string() }).parse(d))
  .handler(async ({ data: { ip } }) => {
    await authService.checkRateLimit(ip);
    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// ENQUIRIES
// ══════════════════════════════════════════════════════════════════════════════

export const supabaseListEnquiries = createServerFn({ method: "GET" }).handler(
  async (): Promise<Enquiry[]> => {
    try {
      await authService.verifyAdminAuth();
      return await customerService.listEnquiries();
    } catch (err: any) {
      console.warn(
        "[Database Warning] Missing schema or tables. Falling back to local mockDb for enquiries...",
        err.message,
      );
      const { db: mockDb } = await import("./mockDb");
      return mockDb.enquiries.list();
    }
  },
);

export const supabaseSubmitEnquiry = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        name: z.string().min(1).max(100),
        phone: z.string().min(6).max(20),
        email: z
          .string()
          .email()
          .max(255)
          .optional()
          .or(z.literal("").transform(() => undefined)),
        message: z.string().max(2000).optional(),
        project_id: z.string().optional(),
        project_name: z.string().optional(),
        budget: z.string().optional(),
        source: z.enum(["website", "call", "whatsapp", "walk-in"]).default("website"),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    authService.validateCSRF();
    await customerService.submitEnquiry(data);
    return { ok: true };
  });

export const supabaseUpdateEnquiry = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string(), data: z.record(z.any()) }).parse(d))
  .handler(async ({ data: { id, data: updates } }) => {
    const admin = await authService.verifyAdminAuth();
    await customerService.updateEnquiry(id, updates);
    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "update_enquiry",
      details: { enquiry_id: id, updates },
    });
    return { ok: true };
  });

export const supabaseDeleteEnquiry = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    const admin = await authService.verifyAdminAuth();
    await customerService.deleteEnquiry(id);
    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "delete_enquiry",
      details: { enquiry_id: id },
    });
    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// SITE VISITS
// ══════════════════════════════════════════════════════════════════════════════

export const supabaseListSiteVisits = createServerFn({ method: "GET" }).handler(
  async (): Promise<SiteVisit[]> => {
    try {
      await authService.verifyAdminAuth();
      const { data, error } = await supabaseAdmin
        .from("site_visits")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as SiteVisit[];
    } catch (err: any) {
      console.warn(
        "[Database Warning] Missing schema or tables. Falling back to local mockDb for site visits...",
        err.message,
      );
      const { db: mockDb } = await import("./mockDb");
      return mockDb.siteVisits.list();
    }
  },
);

export const supabaseSubmitSiteVisit = createServerFn({ method: "POST" })
  .validator((d) =>
    z
      .object({
        name: z.string().min(1).max(100),
        phone: z.string().min(6).max(20),
        email: z
          .string()
          .email()
          .max(255)
          .optional()
          .or(z.literal("").transform(() => undefined)),
        preferred_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        preferred_time: z.string().min(1).max(40),
        message: z.string().max(2000).optional(),
        project_id: z.string().optional(),
        project_name: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    authService.validateCSRF();

    // Insert site visit using supabaseAdmin
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

export const supabaseUpdateSiteVisit = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string(), data: z.record(z.any()) }).parse(d))
  .handler(async ({ data: { id, data: updates } }) => {
    const admin = await authService.verifyAdminAuth();
    const { error } = await supabaseAdmin
      .from("site_visits")
      .update(updates as any)
      .eq("id", id);

    if (error) throw error;

    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "update_site_visit",
      details: { site_visit_id: id, updates },
    });

    return { ok: true };
  });

export const supabaseDeleteSiteVisit = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    const admin = await authService.verifyAdminAuth();
    const { error } = await supabaseAdmin.from("site_visits").delete().eq("id", id);

    if (error) throw error;

    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "delete_site_visit",
      details: { site_visit_id: id },
    });

    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// BOOKINGS
// ══════════════════════════════════════════════════════════════════════════════

export const supabaseListBookings = createServerFn({ method: "GET" }).handler(
  async (): Promise<Booking[]> => {
    try {
      await authService.verifyAdminAuth();
      return await customerService.listBookings();
    } catch (err: any) {
      console.warn(
        "[Database Warning] Missing schema or tables. Falling back to local mockDb for bookings...",
        err.message,
      );
      const { db: mockDb } = await import("./mockDb");
      return mockDb.bookings.list();
    }
  },
);

export const supabaseCreateBooking = createServerFn({ method: "POST" })
  .validator((d) => bookingSchema.parse(d))
  .handler(async ({ data }) => {
    const admin = await authService.verifyAdminAuth();
    const booking = await customerService.createBooking(data as any);
    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "create_booking",
      details: { booking_id: booking.id, data },
    });
    return { ok: true, id: booking.id };
  });

export const supabaseUpdateBooking = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string(), data: z.record(z.any()) }).parse(d))
  .handler(async ({ data: { id, data: updates } }) => {
    const admin = await authService.verifyAdminAuth();
    await customerService.updateBooking(id, updates);
    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "update_booking",
      details: { booking_id: id, updates },
    });
    return { ok: true };
  });

export const supabaseDeleteBooking = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    const admin = await authService.verifyAdminAuth();
    await customerService.deleteBooking(id);
    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "delete_booking",
      details: { booking_id: id },
    });
    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// CUSTOMERS
// ══════════════════════════════════════════════════════════════════════════════

export const supabaseListCustomers = createServerFn({ method: "GET" }).handler(
  async (): Promise<Customer[]> => {
    try {
      await authService.verifyAdminAuth();
      return await customerService.listCustomers();
    } catch (err: any) {
      console.warn(
        "[Database Warning] Missing schema or tables. Falling back to local mockDb for customers...",
        err.message,
      );
      const { db: mockDb } = await import("./mockDb");
      return mockDb.customers.list();
    }
  },
);

export const supabaseCreateCustomer = createServerFn({ method: "POST" })
  .validator((d) => customerSchema.parse(d))
  .handler(async ({ data }) => {
    const admin = await authService.verifyAdminAuth();
    const customer = await customerService.createCustomer(data as any);
    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "create_customer",
      details: { customer_id: customer.id, data },
    });
    return { ok: true, id: customer.id };
  });

export const supabaseUpdateCustomer = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string(), data: z.record(z.any()) }).parse(d))
  .handler(async ({ data: { id, data: updates } }) => {
    const admin = await authService.verifyAdminAuth();
    await customerService.updateCustomer(id, updates as any);
    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "update_customer",
      details: { customer_id: id, updates },
    });
    return { ok: true };
  });

export const supabaseDeleteCustomer = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    const admin = await authService.verifyAdminAuth();
    await customerService.deleteCustomer(id);
    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "delete_customer",
      details: { customer_id: id },
    });
    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════════════════════

export const supabaseListNotifications = createServerFn({ method: "GET" }).handler(
  async (): Promise<Notification[]> => {
    try {
      await authService.verifyAdminAuth();
      const { data, error } = await supabaseAdmin
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as Notification[];
    } catch (err: any) {
      console.warn(
        "[Database Warning] Missing schema or tables. Falling back to local mockDb for notifications...",
        err.message,
      );
      const { db: mockDb } = await import("./mockDb");
      return mockDb.notifications.list();
    }
  },
);

export const supabaseMarkNotificationRead = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    await authService.verifyAdminAuth();
    const { error } = await supabaseAdmin.from("notifications").update({ read: true }).eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

export const supabaseMarkAllNotificationsRead = createServerFn({ method: "POST" }).handler(
  async () => {
    await authService.verifyAdminAuth();
    const { error } = await supabaseAdmin
      .from("notifications")
      .update({ read: true })
      .eq("read", false);
    if (error) throw error;
    return { ok: true };
  },
);

export const supabaseDeleteNotification = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    await authService.verifyAdminAuth();
    const { error } = await supabaseAdmin.from("notifications").delete().eq("id", id);
    if (error) throw error;
    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// PROJECTS
// ══════════════════════════════════════════════════════════════════════════════

export const supabaseListProjects = createServerFn({ method: "GET" }).handler(
  async (): Promise<Project[]> => {
    try {
      return await projectService.listProjects();
    } catch (err: any) {
      console.warn(
        "[Database Warning] Missing schema or tables. Falling back to local mockDb for projects...",
        err.message,
      );
      const { db: mockDb } = await import("./mockDb");
      return mockDb.projects.list();
    }
  },
);

export const supabaseCreateProject = createServerFn({ method: "POST" })
  .validator((d) => projectSchema.parse(d))
  .handler(async ({ data }) => {
    const admin = await authService.verifyAdminAuth();
    const project = await projectService.createProject(data as any);
    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "create_project",
      details: { project_id: project.id, name: project.name },
    });
    return { ok: true, id: project.id };
  });

export const supabaseUpdateProject = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string(), data: z.record(z.any()) }).parse(d))
  .handler(async ({ data: { id, data: updates } }) => {
    const admin = await authService.verifyAdminAuth();
    await projectService.updateProject(id, updates as any);
    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "update_project",
      details: { project_id: id, updates },
    });
    return { ok: true };
  });

export const supabaseDeleteProject = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    const admin = await authService.verifyAdminAuth();
    await projectService.deleteProject(id);
    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "delete_project",
      details: { project_id: id },
    });
    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// PLOTS
// ══════════════════════════════════════════════════════════════════════════════

export const supabaseListPlots = createServerFn({ method: "GET" }).handler(
  async (): Promise<Plot[]> => {
    try {
      return await projectService.listPlots();
    } catch (err: any) {
      console.warn(
        "[Database Warning] Missing schema or tables. Falling back to local mockDb for plots...",
        err.message,
      );
      const { db: mockDb } = await import("./mockDb");
      return mockDb.plots.list();
    }
  },
);

export const supabaseCreatePlot = createServerFn({ method: "POST" })
  .validator((d) => plotSchema.parse(d))
  .handler(async ({ data }) => {
    const admin = await authService.verifyAdminAuth();
    const plot = await projectService.createPlot(data as any);
    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "create_plot",
      details: { plot_id: plot.id, plot_number: plot.plot_number },
    });
    return { ok: true, id: plot.id };
  });

export const supabaseUpdatePlot = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string(), data: z.record(z.any()) }).parse(d))
  .handler(async ({ data: { id, data: updates } }) => {
    const admin = await authService.verifyAdminAuth();
    await projectService.updatePlot(id, updates as any);
    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "update_plot",
      details: { plot_id: id, updates },
    });
    return { ok: true };
  });

export const supabaseDeletePlot = createServerFn({ method: "POST" })
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data: { id } }) => {
    const admin = await authService.verifyAdminAuth();
    await projectService.deletePlot(id);
    await auditRepo.logAction({
      user_id: admin.userId,
      email: admin.email,
      ip_address: getClientIp(),
      action: "delete_plot",
      details: { plot_id: id },
    });
    return { ok: true };
  });

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ══════════════════════════════════════════════════════════════════════════════

export const supabaseGetStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    await authService.verifyAdminAuth();

    // Dynamic aggregations via postgresql joins
    const [
      { count: projectsCount },
      { data: plots },
      { data: enquiries },
      { data: visits },
      { data: bookings },
      { count: customersCount },
    ] = await Promise.all([
      supabaseAdmin.from("projects").select("*", { count: "exact", head: true }),
      supabaseAdmin.from("plots").select("availability"),
      supabaseAdmin.from("enquiries").select("lead_status"),
      supabaseAdmin.from("site_visits").select("status"),
      supabaseAdmin.from("bookings").select("status, paid_amount"),
      supabaseAdmin.from("customers").select("*", { count: "exact", head: true }),
    ]);

    const revenue = (bookings || [])
      .filter((b) => b.status !== "cancelled")
      .reduce((s, b) => s + Number(b.paid_amount ?? 0), 0);

    return {
      projects: projectsCount || 0,
      plots: (plots || []).length,
      plotsAvailable: (plots || []).filter((p) => p.availability === "available").length,
      plotsReserved: (plots || []).filter((p) => p.availability === "reserved").length,
      plotsSold: (plots || []).filter((p) => p.availability === "sold").length,
      enquiries: (enquiries || []).length,
      enquiriesNew: (enquiries || []).filter((e) => e.lead_status === "new").length,
      visits: (visits || []).length,
      visitsPending: (visits || []).filter((v) => v.status === "pending").length,
      bookings: (bookings || []).length,
      revenue,
      customers: customersCount || 0,
    };
  } catch (err: any) {
    console.warn(
      "[Database Warning] Missing schema or tables. Falling back to local mockDb stats calculation...",
      err.message,
    );
    const { db: mockDb } = await import("./mockDb");
    const projects = mockDb.projects.list();
    const plots = mockDb.plots.list();
    const enquiries = mockDb.enquiries.list();
    const visits = mockDb.siteVisits.list();
    const bookings = mockDb.bookings.list();
    const customers = mockDb.customers.list();

    const revenue = bookings
      .filter((b) => b.status !== "cancelled")
      .reduce((s, b) => s + Number(b.paid_amount ?? 0), 0);

    return {
      projects: projects.length,
      plots: plots.length,
      plotsAvailable: plots.filter((p) => p.availability === "available").length,
      plotsReserved: plots.filter((p) => p.availability === "reserved").length,
      plotsSold: plots.filter((p) => p.availability === "sold").length,
      enquiries: enquiries.length,
      enquiriesNew: enquiries.filter((e) => e.lead_status === "new").length,
      visits: visits.length,
      visitsPending: visits.filter((v) => v.status === "pending").length,
      bookings: bookings.length,
      revenue,
      customers: customers.length,
    };
  }
});
