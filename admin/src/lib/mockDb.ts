// localStorage-based fallback store for Admin Portal
// Used only when MongoDB is NOT configured (dev/offline mode).
// All project/plot data fallbacks are restored.
// Customer, Booking, Enquiry, SiteVisit, and Notification mocks are completely clean (empty).

export type Project = {
  id: string;
  slug: string;
  name: string;
  description: string;
  district: string;
  village?: string;
  city: string;
  state: string;
  status: "active" | "upcoming" | "sold_out";
  featured: boolean;
  thumbnail_url: string;
  approval_types: string[];
  amenities: string[];
  gallery_urls?: string[];
  brochure_url?: string;
  video_url?: string;
  video_urls?: string[];
  location_link?: string;
  rera_number?: string;
  deleted_at?: string | null;
  deleted_by?: string | null;
  created_at: string;
};

export type Plot = {
  id: string;
  project_id: string;
  project_name: string;
  plot_number: string;
  area_sqyd: number;
  price_per_sqyd: number;
  facing: string;
  plot_type: "open" | "villa" | "commercial" | "farm";
  availability: "available" | "reserved" | "sold";
  images?: string[];
  created_at: string;
};

export type Enquiry = {
  id: string;
  name: string;
  phone: string;
  email: string;
  project_id: string;
  project_name: string;
  message: string;
  lead_status: "new" | "contacted" | "interested" | "visited" | "converted" | "lost";
  budget: string;
  notes: string;
  source?: "website" | "call" | "whatsapp" | "walk-in";
  created_at: string;
};

export type SiteVisit = {
  id: string;
  name: string;
  phone: string;
  project_id: string;
  project_name: string;
  preferred_date: string;
  preferred_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  checked?: boolean;
  created_at: string;
};

export type Booking = {
  id: string;
  customer_name: string;
  customer_phone: string;
  project_name?: string;
  plot_number?: string;
  total_amount: number;
  paid_amount: number;
  status: "advance" | "partial" | "completed" | "cancelled";
  booking_date: string;
  created_at: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  source: "website" | "referral" | "walk-in" | "social";
  status: "lead" | "prospect" | "customer" | "inactive";
  notes?: string;
  created_at: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  created_at: string;
};

const DEFAULT_PROJECTS: Project[] = [];

const DEFAULT_PLOTS: Plot[] = [];

function load<T>(key: string, defaults: T[] = []): T[] {
  try {
    const raw = localStorage.getItem(`hanrao_admin_${key}`);
    if (!raw) {
      save(key, defaults);
      return defaults;
    }
    return JSON.parse(raw) as T[];
  } catch {
    return defaults;
  }
}

function save<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(`hanrao_admin_${key}`, JSON.stringify(data));
  } catch {}
}

function genId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export const db = {
  projects: {
    list: (): Project[] => load("projects", DEFAULT_PROJECTS),
    get: (id: string): Project | undefined =>
      load<Project>("projects", DEFAULT_PROJECTS).find((p) => p.id === id),
    create: (data: Omit<Project, "id" | "created_at">): Project => {
      const items = load<Project>("projects", DEFAULT_PROJECTS);
      const newItem: Project = { ...data, id: genId(), created_at: new Date().toISOString() };
      save("projects", [...items, newItem]);
      return newItem;
    },
    update: (id: string, data: Partial<Project>): Project => {
      const items = load<Project>("projects", DEFAULT_PROJECTS);
      const idx = items.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error("Not found");
      items[idx] = { ...items[idx], ...data };
      save("projects", items);
      return items[idx];
    },
    delete: (id: string): void => {
      save(
        "projects",
        load<Project>("projects", DEFAULT_PROJECTS).filter((p) => p.id !== id),
      );
    },
  },
  plots: {
    list: (): Plot[] => load("plots", DEFAULT_PLOTS),
    create: (data: Omit<Plot, "id" | "created_at">): Plot => {
      const items = load<Plot>("plots", DEFAULT_PLOTS);
      const newItem: Plot = { ...data, id: genId(), created_at: new Date().toISOString() };
      save("plots", [...items, newItem]);
      return newItem;
    },
    update: (id: string, data: Partial<Plot>): Plot => {
      const items = load<Plot>("plots", DEFAULT_PLOTS);
      const idx = items.findIndex((p) => p.id === id);
      if (idx === -1) throw new Error("Not found");
      items[idx] = { ...items[idx], ...data };
      save("plots", items);
      return items[idx];
    },
    delete: (id: string): void => {
      save(
        "plots",
        load<Plot>("plots", DEFAULT_PLOTS).filter((p) => p.id !== id),
      );
    },
  },
  enquiries: {
    list: (): Enquiry[] => load("enquiries"),
    update: (id: string, data: Partial<Enquiry>): Enquiry => {
      const items = load<Enquiry>("enquiries");
      const idx = items.findIndex((e) => e.id === id);
      if (idx === -1) throw new Error("Not found");
      items[idx] = { ...items[idx], ...data };
      save("enquiries", items);
      return items[idx];
    },
    delete: (id: string): void => {
      save(
        "enquiries",
        load<Enquiry>("enquiries").filter((e) => e.id !== id),
      );
    },
  },
  siteVisits: {
    list: (): SiteVisit[] => load("site_visits"),
    update: (id: string, data: Partial<SiteVisit>): SiteVisit => {
      const items = load<SiteVisit>("site_visits");
      const idx = items.findIndex((v) => v.id === id);
      if (idx === -1) throw new Error("Not found");
      items[idx] = { ...items[idx], ...data };
      save("site_visits", items);
      return items[idx];
    },
    delete: (id: string): void => {
      save(
        "site_visits",
        load<SiteVisit>("site_visits").filter((v) => v.id !== id),
      );
    },
  },
  bookings: {
    list: (): Booking[] => load("bookings"),
    create: (data: Omit<Booking, "id" | "created_at">): Booking => {
      const items = load<Booking>("bookings");
      const newItem: Booking = { ...data, id: genId(), created_at: new Date().toISOString() };
      save("bookings", [...items, newItem]);
      return newItem;
    },
    update: (id: string, data: Partial<Booking>): Booking => {
      const items = load<Booking>("bookings");
      const idx = items.findIndex((b) => b.id === id);
      if (idx === -1) throw new Error("Not found");
      items[idx] = { ...items[idx], ...data };
      save("bookings", items);
      return items[idx];
    },
    delete: (id: string): void => {
      save(
        "bookings",
        load<Booking>("bookings").filter((b) => b.id !== id),
      );
    },
  },
  customers: {
    list: (): Customer[] => load("customers"),
    create: (data: Omit<Customer, "id" | "created_at">): Customer => {
      const items = load<Customer>("customers");
      const newItem: Customer = { ...data, id: genId(), created_at: new Date().toISOString() };
      save("customers", [...items, newItem]);
      return newItem;
    },
    update: (id: string, data: Partial<Customer>): Customer => {
      const items = load<Customer>("customers");
      const idx = items.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error("Not found");
      items[idx] = { ...items[idx], ...data };
      save("customers", items);
      return items[idx];
    },
    delete: (id: string): void => {
      save(
        "customers",
        load<Customer>("customers").filter((c) => c.id !== id),
      );
    },
  },
  notifications: {
    list: (): Notification[] => load("notifications"),
    markRead: (id: string): void => {
      const items = load<Notification>("notifications");
      const idx = items.findIndex((n) => n.id === id);
      if (idx !== -1) {
        items[idx].read = true;
        save("notifications", items);
      }
    },
    markAllRead: (): void => {
      save(
        "notifications",
        load<Notification>("notifications").map((n) => ({ ...n, read: true })),
      );
    },
    delete: (id: string): void => {
      save(
        "notifications",
        load<Notification>("notifications").filter((n) => n.id !== id),
      );
    },
  },
  stats: () => {
    const plots = load<Plot>("plots", DEFAULT_PLOTS);
    const enquiries = load<Enquiry>("enquiries");
    const visits = load<SiteVisit>("site_visits");
    const bookings = load<Booking>("bookings");
    const projects = load<Project>("projects", DEFAULT_PROJECTS);
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
      revenue: bookings
        .filter((b) => b.status !== "cancelled")
        .reduce((sum, b) => sum + b.paid_amount, 0),
    };
  },
  auth: {
    login: (
      email: string,
      _password: string,
    ): { user: { id: string; email: string }; access_token: string } => {
      const session = { user: { id: "admin-id", email }, access_token: "token-" + Date.now() };
      localStorage.setItem("hanrao_admin_session", JSON.stringify(session));
      return session;
    },
    logout: (): void => {
      localStorage.removeItem("hanrao_admin_session");
    },
    getSession: (): { user: { id: string; email: string } } | null => {
      try {
        const raw = localStorage.getItem("hanrao_admin_session");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
  },
};
