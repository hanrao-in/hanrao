import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type Enquiry, type SiteVisit } from "@/lib/adminDb";
import {
  Building2,
  MapPinned,
  MessageSquare,
  CalendarCheck,
  TrendingUp,
  BookOpen,
  Users,
  IndianRupee,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/dashboard")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Dashboard · Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => (
    <AdminShell title="Dashboard">
      <Dashboard />
    </AdminShell>
  ),
});

type Stats = Awaited<ReturnType<typeof adminDb.stats>>;

function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, enq, vis] = await Promise.all([
          adminDb.stats(),
          adminDb.enquiries.list(),
          adminDb.siteVisits.list(),
        ]);
        setStats(s);
        setEnquiries(enq.slice(0, 5));
        setVisits(vis.filter((v) => v.status === "pending").slice(0, 5));
      } catch (e: any) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const cards = [
    {
      label: "Projects",
      value: stats.projects,
      icon: Building2,
      to: "/projects",
      color: "text-blue-600 bg-blue-50",
    },
    {
      label: "Total Plots",
      value: stats.plots,
      icon: MapPinned,
      to: "/plots",
      color: "text-purple-600 bg-purple-50",
    },
    {
      label: "Enquiries",
      value: stats.enquiries,
      icon: MessageSquare,
      to: "/enquiries",
      color: "text-amber-600 bg-amber-50",
    },
    {
      label: "Site Visits",
      value: stats.visits,
      icon: CalendarCheck,
      to: "/notifications",
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Bookings",
      value: stats.bookings,
      icon: BookOpen,
      to: "/bookings",
      color: "text-rose-600 bg-rose-50",
    },
    {
      label: "Customers",
      value: (stats as any).customers ?? 0,
      icon: Users,
      to: "/customers",
      color: "text-indigo-600 bg-indigo-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {c.label}
              </div>
              <div className={`rounded-full p-2 ${c.color}`}>
                <c.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 font-serif text-3xl font-semibold">{c.value}</div>
          </Link>
        ))}
      </div>

      {/* Plot availability */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
              <MapPinned className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Available
            </div>
          </div>
          <div className="mt-3 font-serif text-2xl font-semibold text-emerald-600">
            {stats.plotsAvailable}
          </div>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-50 p-2 text-amber-600">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reserved
            </div>
          </div>
          <div className="mt-3 font-serif text-2xl font-semibold text-amber-600">
            {stats.plotsReserved}
          </div>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-muted p-2 text-muted-foreground">
              <IndianRupee className="h-4 w-4" />
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sold
            </div>
          </div>
          <div className="mt-3 font-serif text-2xl font-semibold">{stats.plotsSold}</div>
        </div>
      </div>

      {/* Recent enquiries + visits */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold">Recent Enquiries</h2>
            <Link to="/enquiries" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          {enquiries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enquiries yet.</p>
          ) : (
            <ul className="space-y-3">
              {enquiries.map((e) => (
                <li key={e.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.project_name || "—"}</div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      e.lead_status === "new"
                        ? "bg-blue-50 text-blue-600"
                        : e.lead_status === "converted"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {e.lead_status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold">Upcoming Site Visits</h2>
            <Link to="/notifications" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          {visits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No site visits yet.</p>
          ) : (
            <ul className="space-y-3">
              {visits.map((v) => (
                <li key={v.id} className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{v.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.preferred_date} · {v.preferred_time}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      v.status === "confirmed"
                        ? "bg-blue-50 text-blue-600"
                        : v.status === "completed"
                          ? "bg-emerald-50 text-emerald-600"
                          : v.status === "cancelled"
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {v.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Revenue */}
      <div className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
        <div className="flex items-center gap-3 mb-2">
          <div className="rounded-full bg-emerald-50 p-2 text-emerald-600">
            <IndianRupee className="h-4 w-4" />
          </div>
          <h2 className="font-serif text-lg font-semibold">Total Revenue Collected</h2>
        </div>
        <div className="font-serif text-3xl font-semibold text-emerald-600">
          ₹{(stats.revenue / 100000).toFixed(1)} L
        </div>
        <p className="text-xs text-muted-foreground mt-1">Across all active bookings</p>
      </div>
    </div>
  );
}
