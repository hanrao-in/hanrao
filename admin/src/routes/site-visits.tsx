import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type SiteVisit, type Project } from "@/lib/adminDb";
import { supabase, isSupabaseUnconfigured } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  ChevronDown,
  Loader2,
  X,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Timer,
} from "lucide-react";

export const Route = createFileRoute("/site-visits")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Site Visits · Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => (
    <AdminShell title="Site Visits">
      <SiteVisits />
    </AdminShell>
  ),
});

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;

function SiteVisits() {
  const [items, setItems] = useState<SiteVisit[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<SiteVisit | null>(null);

  const fetchItems = async () => {
    try {
      const [visitData, projData] = await Promise.all([
        adminDb.siteVisits.list(),
        adminDb.projects.list(),
      ]);
      setItems(visitData);
      setProjects(projData);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    if (!isSupabaseUnconfigured()) {
      const channel = supabase
        .channel("site_visits_changes")
        .on("postgres_changes", { event: "*", schema: "public", table: "site_visits" }, () => {
          fetchItems();
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  // Stat counters
  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter((v) => v.status === "pending").length;
    const confirmed = items.filter((v) => v.status === "confirmed").length;
    const completed = items.filter((v) => v.status === "completed").length;
    const cancelled = items.filter((v) => v.status === "cancelled").length;
    return { total, pending, confirmed, completed, cancelled };
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((v) => {
        const match =
          v.name.toLowerCase().includes(search.toLowerCase()) ||
          v.phone.includes(search) ||
          (v.project_name || "").toLowerCase().includes(search.toLowerCase());
        const statusMatch = statusFilter === "all" || v.status === statusFilter;
        return match && statusMatch;
      }),
    [items, search, statusFilter],
  );

  const updateStatus = async (v: SiteVisit, status: string) => {
    try {
      await adminDb.siteVisits.update(v.id, { status: status as any });
      await fetchItems();
      if (selected?.id === v.id) setSelected((prev) => prev ? { ...prev, status: status as any } : null);
      toast.success("Status updated");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleChecked = async (v: SiteVisit) => {
    try {
      await adminDb.siteVisits.update(v.id, { checked: !v.checked });
      await fetchItems();
      if (selected?.id === v.id) setSelected((prev) => prev ? { ...prev, checked: !prev.checked } : null);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const remove = async (v: SiteVisit) => {
    if (!confirm(`Delete visit for ${v.name}?`)) return;
    try {
      await adminDb.siteVisits.delete(v.id);
      await fetchItems();
      if (selected?.id === v.id) setSelected(null);
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statusColor = (s: string) =>
    s === "pending"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : s === "confirmed"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : s === "completed"
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-red-50 text-red-700 border-red-200";

  const statusIcon = (s: string) => {
    if (s === "pending") return <Timer className="h-4 w-4" />;
    if (s === "confirmed") return <AlertCircle className="h-4 w-4" />;
    if (s === "completed") return <CheckCircle2 className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  // Check if a visit date is today or upcoming
  const isUpcoming = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d >= today;
  };

  return (
    <div className="space-y-6">
      {/* Stat Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Visits</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight">{stats.total}</span>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">⏳ Pending</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-amber-600">{stats.pending}</span>
            <div className="rounded-full bg-amber-100 p-2 text-amber-600">
              <Timer className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">✅ Confirmed</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-blue-600">{stats.confirmed}</span>
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">🎉 Completed</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-emerald-600">{stats.completed}</span>
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone or project…"
              className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:border-primary w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="all">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">{filtered.length} of {stats.total} visits</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3.5 text-left w-8">✓</th>
                <th className="px-4 py-3.5 text-left">Visitor</th>
                <th className="px-4 py-3.5 text-left hidden md:table-cell">Phone</th>
                <th className="px-4 py-3.5 text-left hidden lg:table-cell">Project</th>
                <th className="px-4 py-3.5 text-left">Visit Date</th>
                <th className="px-4 py-3.5 text-left hidden md:table-cell">Time</th>
                <th className="px-4 py-3.5 text-left">Status</th>
                <th className="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No visits found matching your criteria.
                  </td>
                </tr>
              )}
              {filtered.map((v) => (
                <tr
                  key={v.id}
                  className={`hover:bg-secondary/30 cursor-pointer transition-colors ${v.checked ? "opacity-60" : ""}`}
                  onClick={() => setSelected(v)}
                >
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={!!v.checked}
                      onChange={() => toggleChecked(v)}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                      title="Mark as reviewed"
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-medium">{v.name}</div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell text-foreground/80">{v.phone}</td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground/60" />
                      {v.project_name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 ${isUpcoming(v.preferred_date) ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                      {new Date(v.preferred_date + "T00:00:00").toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/60" />
                      {v.preferred_time}
                    </span>
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="relative inline-block">
                      <select
                        value={v.status}
                        onChange={(e) => updateStatus(v, e.target.value)}
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6 ${statusColor(v.status)}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s} className="capitalize">
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none opacity-60" />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => remove(v)}
                      className="rounded p-1.5 hover:bg-destructive/10 text-destructive transition-colors"
                      title="Delete visit"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Drawer Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                Visit Details
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${statusColor(selected.status)}`}>
                  {statusIcon(selected.status)}
                  {selected.status}
                </span>
              </h2>
              <button onClick={() => setSelected(null)} className="rounded-full p-1 hover:bg-secondary">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* Quick Communication */}
              <div className="grid grid-cols-2 gap-3 bg-secondary/40 p-3 rounded-xl border border-border/80">
                <a
                  href={`tel:${selected.phone}`}
                  className="flex items-center justify-center gap-2 rounded-lg bg-background py-2 text-xs font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-amber-500" />
                  Call Visitor
                </a>
                <a
                  href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-background py-2 text-xs font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                  WhatsApp
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Visitor Name</span>
                  <div className="font-semibold text-foreground text-base mt-0.5">{selected.name}</div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</span>
                  <div className="font-semibold text-foreground text-base mt-0.5">{selected.phone}</div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Project</span>
                  <div className="text-foreground mt-0.5">{selected.project_name || "—"}</div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Reviewed</span>
                  <div className="mt-0.5">
                    <button
                      onClick={() => toggleChecked(selected)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors ${
                        selected.checked
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      }`}
                    >
                      {selected.checked ? "✓ Reviewed" : "Not reviewed"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Date & Time highlight */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-semibold">
                    {new Date(selected.preferred_date + "T00:00:00").toLocaleDateString("en-IN", {
                      weekday: "short",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{selected.preferred_time}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Visit Status
                </label>
                <select
                  value={selected.status}
                  onChange={(e) => updateStatus(selected, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none font-medium"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelected(null)}
                className="rounded-full bg-secondary border border-border px-5 py-2 text-sm font-semibold hover:bg-secondary/80 transition-colors text-foreground"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
