import {
  supabaseListEnquiries,
  supabaseSubmitEnquiry,
  supabaseUpdateEnquiry,
  supabaseDeleteEnquiry,
  supabaseListSiteVisits,
  supabaseUpdateSiteVisit,
  supabaseDeleteSiteVisit,
  supabaseListBookings,
  supabaseCreateBooking,
  supabaseUpdateBooking,
  supabaseDeleteBooking,
  supabaseListCustomers,
  supabaseCreateCustomer,
  supabaseUpdateCustomer,
  supabaseDeleteCustomer,
  supabaseListNotifications,
  supabaseMarkNotificationRead,
  supabaseMarkAllNotificationsRead,
  supabaseDeleteNotification,
  supabaseListProjects,
  supabaseCreateProject,
  supabaseUpdateProject,
  supabaseDeleteProject,
  supabaseListPlots,
  supabaseCreatePlot,
  supabaseUpdatePlot,
  supabaseDeletePlot,
  supabaseGetStats,
} from "./supabase.functions";
import type { Project, Plot, Enquiry, SiteVisit, Booking, Customer, Notification } from "./mockDb";

export type { Project, Plot, Enquiry, SiteVisit, Booking, Customer, Notification };

const checkDatabase = (res: any) => {
  if (res === null || (res && res.notConfigured)) {
    throw new Error(
      "Supabase database is not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file.",
    );
  }
};

export const adminDb = {
  // ─── PROJECTS ────────────────────────────────────────────────────────────
  projects: {
    list: async (): Promise<Project[]> => {
      const data = await supabaseListProjects();
      checkDatabase(data);
      return data || [];
    },
    create: async (d: Omit<Project, "id" | "created_at">): Promise<Project> => {
      const result = await supabaseCreateProject({ data: d as any });
      checkDatabase(result);
      const list = await supabaseListProjects();
      checkDatabase(list);
      return (
        list.find((p) => p.id === result.id) ??
        ({ ...d, id: result.id!, created_at: new Date().toISOString() } as Project)
      );
    },
    update: async (id: string, d: Partial<Project>): Promise<Project> => {
      const result = await supabaseUpdateProject({ data: { id, data: d as any } });
      checkDatabase(result);
      const list = await supabaseListProjects();
      checkDatabase(list);
      return list.find((p) => p.id === id) ?? ({ id, ...d } as Project);
    },
    delete: async (id: string): Promise<void> => {
      const result = await supabaseDeleteProject({ data: { id } });
      checkDatabase(result);
    },
  },

  // ─── PLOTS ───────────────────────────────────────────────────────────────
  plots: {
    list: async (): Promise<Plot[]> => {
      const data = await supabaseListPlots();
      checkDatabase(data);
      return data || [];
    },
    create: async (d: Omit<Plot, "id" | "created_at">): Promise<Plot> => {
      const result = await supabaseCreatePlot({ data: d as any });
      checkDatabase(result);
      const list = await supabaseListPlots();
      checkDatabase(list);
      return (
        list.find((p) => p.id === result.id) ??
        ({ ...d, id: result.id!, created_at: new Date().toISOString() } as Plot)
      );
    },
    update: async (id: string, d: Partial<Plot>): Promise<Plot> => {
      const result = await supabaseUpdatePlot({ data: { id, data: d as any } });
      checkDatabase(result);
      const list = await supabaseListPlots();
      checkDatabase(list);
      return list.find((p) => p.id === id) ?? ({ id, ...d } as Plot);
    },
    delete: async (id: string): Promise<void> => {
      const result = await supabaseDeletePlot({ data: { id } });
      checkDatabase(result);
    },
  },

  // ─── ENQUIRIES ───────────────────────────────────────────────────────────
  enquiries: {
    list: async (): Promise<Enquiry[]> => {
      const data = await supabaseListEnquiries();
      checkDatabase(data);
      return data || [];
    },
    create: async (d: Omit<Enquiry, "id" | "created_at">): Promise<Enquiry> => {
      const result = await supabaseSubmitEnquiry({ data: d as any });
      checkDatabase(result);
      const list = await supabaseListEnquiries();
      checkDatabase(list);
      return list[0] ?? ({ ...d, id: "temp-id", created_at: new Date().toISOString() } as Enquiry);
    },
    update: async (id: string, d: Partial<Enquiry>): Promise<Enquiry> => {
      const result = await supabaseUpdateEnquiry({ data: { id, data: d as any } });
      checkDatabase(result);
      const list = await supabaseListEnquiries();
      checkDatabase(list);
      return list.find((e) => e.id === id) ?? ({ id, ...d } as Enquiry);
    },
    delete: async (id: string): Promise<void> => {
      const result = await supabaseDeleteEnquiry({ data: { id } });
      checkDatabase(result);
    },
  },

  // ─── SITE VISITS ─────────────────────────────────────────────────────────
  siteVisits: {
    list: async (): Promise<SiteVisit[]> => {
      const data = await supabaseListSiteVisits();
      checkDatabase(data);
      return data || [];
    },
    update: async (id: string, d: Partial<SiteVisit>): Promise<SiteVisit> => {
      const result = await supabaseUpdateSiteVisit({ data: { id, data: d as any } });
      checkDatabase(result);
      const list = await supabaseListSiteVisits();
      checkDatabase(list);
      return list.find((v) => v.id === id) ?? ({ id, ...d } as SiteVisit);
    },
    delete: async (id: string): Promise<void> => {
      const result = await supabaseDeleteSiteVisit({ data: { id } });
      checkDatabase(result);
    },
  },

  // ─── BOOKINGS ────────────────────────────────────────────────────────────
  bookings: {
    list: async (): Promise<Booking[]> => {
      const data = await supabaseListBookings();
      checkDatabase(data);
      return data || [];
    },
    create: async (d: Omit<Booking, "id" | "created_at">): Promise<Booking> => {
      const result = await supabaseCreateBooking({
        data: {
          customer_name: d.customer_name,
          customer_phone: d.customer_phone,
          project_name: d.project_name,
          plot_number: d.plot_number,
          total_amount: d.total_amount,
          paid_amount: d.paid_amount,
          status: d.status,
          booking_date: d.booking_date,
        },
      });
      checkDatabase(result);
      const list = await supabaseListBookings();
      checkDatabase(list);
      return (
        list.find((b) => b.id === result.id) ??
        ({ ...d, id: result.id!, created_at: new Date().toISOString() } as Booking)
      );
    },
    update: async (id: string, d: Partial<Booking>): Promise<Booking> => {
      const result = await supabaseUpdateBooking({ data: { id, data: d as any } });
      checkDatabase(result);
      const list = await supabaseListBookings();
      checkDatabase(list);
      return list.find((b) => b.id === id) ?? ({ id, ...d } as Booking);
    },
    delete: async (id: string): Promise<void> => {
      const result = await supabaseDeleteBooking({ data: { id } });
      checkDatabase(result);
    },
  },

  // ─── CUSTOMERS ───────────────────────────────────────────────────────────
  customers: {
    list: async (): Promise<Customer[]> => {
      const data = await supabaseListCustomers();
      checkDatabase(data);
      return data || [];
    },
    create: async (d: Omit<Customer, "id" | "created_at">): Promise<Customer> => {
      const result = await supabaseCreateCustomer({
        data: {
          name: d.name,
          phone: d.phone,
          email: d.email || undefined,
          address: d.address || undefined,
          source: d.source,
          status: d.status,
          notes: d.notes || undefined,
        },
      });
      checkDatabase(result);
      const list = await supabaseListCustomers();
      checkDatabase(list);
      return (
        list.find((c) => c.id === result.id) ??
        ({ ...d, id: result.id!, created_at: new Date().toISOString() } as Customer)
      );
    },
    update: async (id: string, d: Partial<Customer>): Promise<Customer> => {
      const result = await supabaseUpdateCustomer({ data: { id, data: d as any } });
      checkDatabase(result);
      const list = await supabaseListCustomers();
      checkDatabase(list);
      return list.find((c) => c.id === id) ?? ({ id, ...d } as Customer);
    },
    delete: async (id: string): Promise<void> => {
      const result = await supabaseDeleteCustomer({ data: { id } });
      checkDatabase(result);
    },
  },

  // ─── NOTIFICATIONS ───────────────────────────────────────────────────────
  notifications: {
    list: async (): Promise<Notification[]> => {
      const data = await supabaseListNotifications();
      checkDatabase(data);
      return data || [];
    },
    markRead: async (id: string): Promise<void> => {
      const result = await supabaseMarkNotificationRead({ data: { id } });
      checkDatabase(result);
    },
    markAllRead: async (): Promise<void> => {
      const result = await supabaseMarkAllNotificationsRead();
      checkDatabase(result);
    },
    delete: async (id: string): Promise<void> => {
      const result = await supabaseDeleteNotification({ data: { id } });
      checkDatabase(result);
    },
    unreadCount: async (): Promise<number> => {
      const list = await supabaseListNotifications();
      checkDatabase(list);
      return list.filter((n) => !n.read).length;
    },
  },

  // ─── STATS ───────────────────────────────────────────────────────────────
  stats: async () => {
    const s = await supabaseGetStats();
    checkDatabase(s);
    return (
      s || {
        projects: 0,
        plots: 0,
        plotsAvailable: 0,
        plotsReserved: 0,
        plotsSold: 0,
        enquiries: 0,
        enquiriesNew: 0,
        visits: 0,
        visitsPending: 0,
        bookings: 0,
        revenue: 0,
        customers: 0,
      }
    );
  },
};
