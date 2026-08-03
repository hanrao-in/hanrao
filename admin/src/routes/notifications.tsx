import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type SiteVisit } from "@/lib/adminDb";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  CalendarCheck,
  Loader2,
  ChevronDown,
  Check,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/notifications")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Site Visits · Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => (
    <AdminShell title="Site Visits">
      <SiteVisitsAll />
    </AdminShell>
  ),
});

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;

const statusColor = (s: string) =>
  s === "completed"
    ? "bg-emerald-50 text-emerald-700"
    : s === "confirmed"
      ? "bg-blue-50 text-blue-700"
      : s === "cancelled"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

function SiteVisitsAll() {
  const [items, setItems] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [checkedFilter, setCheckedFilter] = useState("all"); // 'all', 'checked', 'unchecked'
  const [updating, setUpdating] = useState<string | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      const data = await adminDb.siteVisits.list();
      setItems(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filtered = useMemo(
    () =>
      items.filter((v) => {
        const q = search.toLowerCase();
        const match =
          v.name.toLowerCase().includes(q) ||
          v.phone.includes(search) ||
          (v.project_name || "").toLowerCase().includes(q);
        const statusMatch = statusFilter === "all" || v.status === statusFilter;

        let checkedMatch = true;
        if (checkedFilter === "checked") checkedMatch = !!v.checked;
        if (checkedFilter === "unchecked") checkedMatch = !v.checked;

        return match && statusMatch && checkedMatch;
      }),
    [items, search, statusFilter, checkedFilter],
  );

  const uncheckedCount = useMemo(() => items.filter((v) => !v.checked).length, [items]);

  const updateStatus = async (v: SiteVisit, status: (typeof STATUSES)[number]) => {
    setUpdating(v.id);
    try {
      await adminDb.siteVisits.update(v.id, { status });
      await fetchItems();
      toast.success(`Marked as ${status}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const toggleChecked = async (v: SiteVisit, isChecked: boolean) => {
    try {
      await adminDb.siteVisits.update(v.id, { checked: isChecked });
      await fetchItems();
      toast.success(isChecked ? "Marked as Checked" : "Marked as Unchecked");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const markAllAsChecked = async () => {
    const unchecked = items.filter((v) => !v.checked);
    if (unchecked.length === 0) return;
    setLoading(true);
    try {
      await Promise.all(unchecked.map((v) => adminDb.siteVisits.update(v.id, { checked: true })));
      await fetchItems();
      toast.success("All visits marked as checked");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (v: SiteVisit) => {
    if (!confirm(`Delete site visit from ${v.name}?`)) return;
    try {
      await adminDb.siteVisits.delete(v.id);
      await fetchItems();
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search visits…"
              className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background outline-none focus:border-primary w-52"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="all">All Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={checkedFilter}
            onChange={(e) => setCheckedFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="all">All Check Status</option>
            <option value="unchecked">Unchecked Only ({uncheckedCount})</option>
            <option value="checked">Checked Only</option>
          </select>
          <span className="self-center text-sm text-muted-foreground">
            {filtered.length} visit{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        {uncheckedCount > 0 && (
          <button
            onClick={markAllAsChecked}
            className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors border border-primary/20 rounded-lg px-3 py-2 bg-primary/5 hover:bg-primary/10"
          >
            <Check className="h-4 w-4" /> Mark all checked
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="table-responsive-container rounded-2xl bg-card shadow-soft ring-1 ring-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left w-12"></th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Project</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Time</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Requested</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                    <CalendarCheck className="mx-auto h-8 w-8 mb-2 opacity-30" />
                    No site visits found.
                  </td>
                </tr>
              )}
              {filtered.map((v) => (
                <tr
                  key={v.id}
                  className={`transition-colors hover:bg-secondary/30 ${
                    !v.checked
                      ? "bg-primary/5 font-semibold text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <td className="px-4 py-3 text-center">
                    {v.checked ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 fill-emerald-50 mx-auto" />
                    ) : (
                      <button
                        onClick={() => toggleChecked(v, true)}
                        className="rounded-full p-1 transition-all focus:outline-none hover:scale-105"
                        title="Confirm / Check visit"
                      >
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/35 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 opacity-0 hover:opacity-100 text-emerald-500 transition-opacity" />
                        </div>
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{v.name}</td>
                  <td className="px-4 py-3">{v.phone}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{v.project_name || "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{v.preferred_date}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">{v.preferred_time}</td>
                  <td className="px-4 py-3">
                    <div className="relative inline-flex items-center gap-1">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(v.status)}`}
                      >
                        {v.status}
                      </span>
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === v.id ? null : v.id)}
                          className="rounded p-1 hover:bg-secondary text-muted-foreground"
                          aria-label="Change status"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                        {openDropdownId === v.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenDropdownId(null)}
                            />
                            <div className="absolute left-0 top-full mt-1 z-20 w-36 rounded-xl border border-border bg-card shadow-xl">
                              {STATUSES.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => {
                                    updateStatus(v, s);
                                    setOpenDropdownId(null);
                                  }}
                                  disabled={v.status === s || updating === v.id}
                                  className={`block w-full text-left px-3 py-2 text-xs capitalize hover:bg-secondary disabled:opacity-40 first:rounded-t-xl last:rounded-b-xl ${
                                    v.status === s ? "font-semibold text-primary" : ""
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs hidden md:table-cell">
                    {new Date(v.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => remove(v)}
                        className="rounded p-1.5 hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
