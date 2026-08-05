import { supabase } from "@/integrations/supabase/client";
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

const checkDatabase = (data: any) => {
  if (data === null || data === undefined) {
    throw new Error(
      "Database Error: Could not connect to Supabase. Check your API keys and network connection.",
    );
  }
};

export const adminDb = {
  // ─── PROJECTS ────────────────────────────────────────────────────────────
  projects: {
    list: async (): Promise<Project[]> => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return (data || []) as unknown as Project[];
      } catch (err: any) {
        console.warn("[Wave 1 Direct Query Fallback] Projects list", err.message);
        return await supabaseListProjects();
      }
    },
    create: async (d: Omit<Project, "id" | "created_at">): Promise<Project> => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .insert(d as any)
          .select()
          .single();

        if (error) throw error;

        // Non-blocking audit log creation
        (async () => {
          try {
            await supabase.from("audit_logs").insert({
              action: "create_project",
              details: { project_id: data.id, name: data.name },
            });
          } catch {}
        })();

        return data as unknown as Project;
      } catch (err: any) {
        console.warn("[Wave 1 Direct Query Fallback] Project create", err.message);
        const result = await supabaseCreateProject({ data: d as any });
        checkDatabase(result);
        return (result as unknown as Project) || ({ ...d, id: (result as any)?.id || Date.now().toString() } as Project);
      }
    },
    update: async (id: string, d: Partial<Project>): Promise<Project> => {
      try {
        const { data, error } = await supabase
          .from("projects")
          .update(d as any)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;

        // Non-blocking audit log creation
        (async () => {
          try {
            await supabase.from("audit_logs").insert({
              action: "update_project",
              details: { project_id: id, updates: d },
            });
          } catch {}
        })();

        return data as unknown as Project;
      } catch (err: any) {
        console.warn("[Wave 1 Direct Query Fallback] Project update", err.message);
        const result = await supabaseUpdateProject({ data: { id, data: d as any } });
        checkDatabase(result);
        return (result as unknown as Project) || ({ id, ...d } as Project);
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from("projects")
          .delete()
          .eq("id", id);

        if (error) throw error;

        // Non-blocking audit log creation
        (async () => {
          try {
            await supabase.from("audit_logs").insert({
              action: "delete_project",
              details: { project_id: id },
            });
          } catch {}
        })();
      } catch (err: any) {
        console.warn("[Wave 1 Direct Query Fallback] Project delete", err.message);
        const result = await supabaseDeleteProject({ data: { id } });
        checkDatabase(result);
      }
    },
  },

  // ─── PLOTS ───────────────────────────────────────────────────────────────
  plots: {
    list: async (): Promise<Plot[]> => {
      try {
        const { data, error } = await supabase
          .from("plots")
          .select("*")
          .order("plot_number", { ascending: true });

        if (error) throw error;
        return (data || []) as unknown as Plot[];
      } catch (err: any) {
        console.warn("[Wave 3 Direct Query Fallback] Plots list", err.message);
        return await supabaseListPlots();
      }
    },
    create: async (d: Omit<Plot, "id" | "created_at">): Promise<Plot> => {
      try {
        const { data, error } = await supabase
          .from("plots")
          .insert(d as any)
          .select()
          .single();

        if (error) throw error;
        return data as unknown as Plot;
      } catch (err: any) {
        console.warn("[Wave 3 Direct Query Fallback] Plot create", err.message);
        const result = await supabaseCreatePlot({ data: d as any });
        checkDatabase(result);
        return (result as unknown as Plot) || ({ ...d, id: (result as any)?.id || Date.now().toString() } as Plot);
      }
    },
    update: async (id: string, d: Partial<Plot>): Promise<Plot> => {
      try {
        const { data, error } = await supabase
          .from("plots")
          .update(d as any)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data as unknown as Plot;
      } catch (err: any) {
        console.warn("[Wave 3 Direct Query Fallback] Plot update", err.message);
        const result = await supabaseUpdatePlot({ data: { id, data: d as any } });
        checkDatabase(result);
        return (result as unknown as Plot) || ({ id, ...d } as Plot);
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from("plots")
          .delete()
          .eq("id", id);

        if (error) throw error;
      } catch (err: any) {
        console.warn("[Wave 3 Direct Query Fallback] Plot delete", err.message);
        const result = await supabaseDeletePlot({ data: { id } });
        checkDatabase(result);
      }
    },
  },

  // ─── ENQUIRIES ───────────────────────────────────────────────────────────
  enquiries: {
    list: async (): Promise<Enquiry[]> => {
      try {
        const { data, error } = await supabase
          .from("enquiries")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return (data || []) as unknown as Enquiry[];
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Enquiries list", err.message);
        return await supabaseListEnquiries();
      }
    },
    create: async (d: Omit<Enquiry, "id" | "created_at">): Promise<Enquiry> => {
      try {
        const { data, error } = await supabase
          .from("enquiries")
          .insert(d as any)
          .select()
          .single();

        if (error) throw error;
        return data as unknown as Enquiry;
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Enquiry create", err.message);
        const result = await supabaseSubmitEnquiry({ data: d as any });
        checkDatabase(result);
        return ({ ...d, id: (result as any)?.id || Date.now().toString(), created_at: new Date().toISOString() } as Enquiry);
      }
    },
    update: async (id: string, d: Partial<Enquiry>): Promise<Enquiry> => {
      try {
        const { data, error } = await supabase
          .from("enquiries")
          .update(d as any)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data as unknown as Enquiry;
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Enquiry update", err.message);
        const result = await supabaseUpdateEnquiry({ data: { id, data: d as any } });
        checkDatabase(result);
        return (result as unknown as Enquiry) || ({ id, ...d } as Enquiry);
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from("enquiries")
          .delete()
          .eq("id", id);

        if (error) throw error;
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Enquiry delete", err.message);
        const result = await supabaseDeleteEnquiry({ data: { id } });
        checkDatabase(result);
      }
    },
  },

  // ─── SITE VISITS ─────────────────────────────────────────────────────────
  siteVisits: {
    list: async (): Promise<SiteVisit[]> => {
      try {
        const { data, error } = await supabase
          .from("site_visits")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return (data || []) as unknown as SiteVisit[];
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Site visits list", err.message);
        return await supabaseListSiteVisits();
      }
    },
    update: async (id: string, d: Partial<SiteVisit>): Promise<SiteVisit> => {
      try {
        const { data, error } = await supabase
          .from("site_visits")
          .update(d as any)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data as unknown as SiteVisit;
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Site visit update", err.message);
        const result = await supabaseUpdateSiteVisit({ data: { id, data: d as any } });
        checkDatabase(result);
        return (result as unknown as SiteVisit) || ({ id, ...d } as SiteVisit);
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from("site_visits")
          .delete()
          .eq("id", id);

        if (error) throw error;
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Site visit delete", err.message);
        const result = await supabaseDeleteSiteVisit({ data: { id } });
        checkDatabase(result);
      }
    },
  },

  // ─── BOOKINGS ────────────────────────────────────────────────────────────
  bookings: {
    list: async (): Promise<Booking[]> => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return (data || []) as unknown as Booking[];
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Bookings list", err.message);
        return await supabaseListBookings();
      }
    },
    create: async (d: Omit<Booking, "id" | "created_at">): Promise<Booking> => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .insert(d as any)
          .select()
          .single();

        if (error) throw error;
        return data as unknown as Booking;
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Booking create", err.message);
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
        return (result as unknown as Booking) || ({ ...d, id: (result as any)?.id || Date.now().toString() } as Booking);
      }
    },
    update: async (id: string, d: Partial<Booking>): Promise<Booking> => {
      try {
        const { data, error } = await supabase
          .from("bookings")
          .update(d as any)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data as unknown as Booking;
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Booking update", err.message);
        const result = await supabaseUpdateBooking({ data: { id, data: d as any } });
        checkDatabase(result);
        return (result as unknown as Booking) || ({ id, ...d } as Booking);
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from("bookings")
          .delete()
          .eq("id", id);

        if (error) throw error;
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Booking delete", err.message);
        const result = await supabaseDeleteBooking({ data: { id } });
        checkDatabase(result);
      }
    },
  },

  // ─── CUSTOMERS ───────────────────────────────────────────────────────────
  customers: {
    list: async (): Promise<Customer[]> => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return (data || []) as unknown as Customer[];
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Customers list", err.message);
        return await supabaseListCustomers();
      }
    },
    create: async (d: Omit<Customer, "id" | "created_at">): Promise<Customer> => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .insert(d as any)
          .select()
          .single();

        if (error) throw error;
        return data as unknown as Customer;
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Customer create", err.message);
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
        return (result as unknown as Customer) || ({ ...d, id: (result as any)?.id || Date.now().toString() } as Customer);
      }
    },
    update: async (id: string, d: Partial<Customer>): Promise<Customer> => {
      try {
        const { data, error } = await supabase
          .from("customers")
          .update(d as any)
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data as unknown as Customer;
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Customer update", err.message);
        const result = await supabaseUpdateCustomer({ data: { id, data: d as any } });
        checkDatabase(result);
        return (result as unknown as Customer) || ({ id, ...d } as Customer);
      }
    },
    delete: async (id: string): Promise<void> => {
      try {
        const { error } = await supabase
          .from("customers")
          .delete()
          .eq("id", id);

        if (error) throw error;
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Customer delete", err.message);
        const result = await supabaseDeleteCustomer({ data: { id } });
        checkDatabase(result);
      }
    },
  },

  // ─── NOTIFICATIONS ───────────────────────────────────────────────────────
  notifications: {
    list: async (): Promise<Notification[]> => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        return (data || []) as unknown as Notification[];
      } catch (err: any) {
        console.warn("[Wave 2 Direct Query Fallback] Notifications list", err.message);
        const data = await supabaseListNotifications();
        checkDatabase(data);
        return data || [];
      }
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
    try {
      const [
        { count: projectsCount, error: err1 },
        { data: plots, error: err2 },
        { data: enquiries, error: err3 },
        { data: visits, error: err4 },
        { data: bookings, error: err5 },
        { count: customersCount, error: err6 },
      ] = await Promise.all([
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("plots").select("availability"),
        supabase.from("enquiries").select("lead_status"),
        supabase.from("site_visits").select("status"),
        supabase.from("bookings").select("status, paid_amount"),
        supabase.from("customers").select("*", { count: "exact", head: true }),
      ]);

      if (err1 || err2 || err3 || err4 || err5 || err6) {
        throw new Error("One or more stats queries failed");
      }

      const plotsList = plots || [];
      const enquiriesList = enquiries || [];
      const visitsList = visits || [];
      const bookingsList = bookings || [];

      const plotsTotal = plotsList.length;
      const plotsAvailable = plotsList.filter((p: any) => p.availability === "available").length;
      const plotsReserved = plotsList.filter((p: any) => p.availability === "reserved").length;
      const plotsSold = plotsList.filter((p: any) => p.availability === "sold").length;

      const enquiriesTotal = enquiriesList.length;
      const enquiriesNew = enquiriesList.filter((e: any) => e.lead_status === "new").length;

      const visitsTotal = visitsList.length;
      const visitsPending = visitsList.filter((v: any) => v.status === "pending").length;

      const bookingsTotal = bookingsList.length;
      const revenue = bookingsList
        .filter((b: any) => b.status !== "cancelled")
        .reduce((sum: number, b: any) => sum + Number(b.paid_amount ?? 0), 0);

      return {
        projects: projectsCount ?? 0,
        plots: plotsTotal,
        plotsAvailable,
        plotsReserved,
        plotsSold,
        enquiries: enquiriesTotal,
        enquiriesNew,
        visits: visitsTotal,
        visitsPending,
        bookings: bookingsTotal,
        revenue,
        customers: customersCount ?? 0,
      };
    } catch (err: any) {
      console.warn("[Wave 1 Direct Query Fallback] Stats", err.message);
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
    }
  },
};
