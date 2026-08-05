import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type Enquiry, type Project } from "@/lib/adminDb";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  X,
  ChevronDown,
  Loader2,
  Phone,
  MessageSquare,
  Plus,
  Building2,
  Wallet,
  Calendar,
  ExternalLink,
  Smartphone,
  Mail,
  User,
  Filter,
} from "lucide-react";

export const Route = createFileRoute("/enquiries")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Enquiries · Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => (
    <AdminShell title="Enquiries">
      <Enquiries />
    </AdminShell>
  ),
});

const STATUSES = ["new", "contacted", "interested", "visited", "converted", "lost"] as const;
const SOURCES = ["website", "call", "whatsapp", "walk-in"] as const;

function Enquiries() {
  const [items, setItems] = useState<Enquiry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Stacking: 'all' | 'call' | 'text'
  const [stackTab, setStackTab] = useState<"all" | "call" | "text">("all");
  
  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    try {
      const [enquiriesData, projectsData] = await Promise.all([
        adminDb.enquiries.list(),
        adminDb.projects.list(),
      ]);
      setItems(enquiriesData);
      setProjects(projectsData);
    } catch (e: any) {
      toast.error(e.message || "Failed to load database connections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Compute stat counters
  const stats = useMemo(() => {
    const total = items.length;
    const calls = items.filter((e) => e.source === "call" || e.source === "walk-in").length;
    const texts = items.filter((e) => e.source === "website" || e.source === "whatsapp" || !e.source).length;
    const news = items.filter((e) => e.lead_status === "new" || !e.lead_status).length;
    return { total, calls, texts, news };
  }, [items]);

  // Filter items based on search, status, and tab stack
  const filtered = useMemo(() => {
    return items.filter((e) => {
      // 1. Search filter
      const matchSearch =
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.phone.includes(search) ||
        (e.project_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (e.message || "").toLowerCase().includes(search.toLowerCase());

      // 2. Status filter
      const matchStatus = statusFilter === "all" || e.lead_status === statusFilter;

      // 3. Stack Tab filter (Call enquiries vs Text enquiries)
      let matchTab = true;
      if (stackTab === "call") {
        matchTab = e.source === "call" || e.source === "walk-in";
      } else if (stackTab === "text") {
        matchTab = e.source === "website" || e.source === "whatsapp" || !e.source;
      }

      return matchSearch && matchStatus && matchTab;
    });
  }, [items, search, statusFilter, stackTab]);

  const updateStatus = async (e: Enquiry, status: string) => {
    try {
      setItems((prev) => prev.map((x) => (x.id === e.id ? { ...x, lead_status: status as any } : x)));
      await adminDb.enquiries.update(e.id, { lead_status: status as any });
      if (selected?.id === e.id) setSelected((prev) => prev ? { ...prev, lead_status: status as any } : null);
      toast.success("Status updated");
    } catch (err: any) {
      fetchItems();
      toast.error(err.message);
    }
  };

  const updateProjectLink = async (e: Enquiry, projectId: string) => {
    try {
      const selectedProj = projects.find((p) => p.id === projectId);
      const updates = {
        project_id: projectId || null,
        project_name: selectedProj ? selectedProj.name : "",
      };
      setItems((prev) => prev.map((x) => (x.id === e.id ? { ...x, ...updates } as any : x)));
      await adminDb.enquiries.update(e.id, updates as any);
      if (selected?.id === e.id) {
        setSelected((prev) => prev ? { ...prev, ...updates } as any : null);
      }
      toast.success("Project linkage updated");
    } catch (err: any) {
      fetchItems();
      toast.error(err.message);
    }
  };

  const updateNotes = async (e: Enquiry, notes: string) => {
    try {
      setItems((prev) => prev.map((x) => (x.id === e.id ? { ...x, notes } : x)));
      await adminDb.enquiries.update(e.id, { notes });
      toast.success("Notes saved");
    } catch (err: any) {
      fetchItems();
      toast.error(err.message);
    }
  };

  const handleAddEnquiry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSubmitting(true);

    const name = String(fd.get("name") ?? "").trim();
    const phone = String(fd.get("phone") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim() || undefined;
    const budget = String(fd.get("budget") ?? "").trim() || undefined;
    const source = String(fd.get("source") ?? "call") as any;
    const message = String(fd.get("message") ?? "").trim() || undefined;
    const projectId = String(fd.get("project_id") ?? "").trim();

    const selectedProj = projects.find((p) => p.id === projectId);
    const projectName = selectedProj ? selectedProj.name : undefined;

    try {
      const created = await adminDb.enquiries.create({
        name,
        phone,
        email,
        budget,
        source,
        message,
        project_id: projectId || undefined,
        project_name: projectName,
        lead_status: "new",
        notes: "",
      } as any);

      setItems((prev) => [created, ...prev]);
      toast.success("Enquiry created successfully");
      setIsAddOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create enquiry");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (e: Enquiry) => {
    if (!confirm(`Delete enquiry from ${e.name}?`)) return;
    try {
      setItems((prev) => prev.filter((x) => x.id !== e.id));
      await adminDb.enquiries.delete(e.id);
      if (selected?.id === e.id) setSelected(null);
      toast.success("Deleted");
    } catch (err: any) {
      fetchItems();
      toast.error(err.message);
    }
  };

  const statusColor = (s: string) =>
    s === "new"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : s === "contacted"
        ? "bg-purple-50 text-purple-700 border-purple-200"
        : s === "interested"
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : s === "visited"
            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
            : s === "converted"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-700 border-red-200";

  const sourceBadge = (s?: string) => {
    const val = s || "website";
    if (val === "call") return <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200">📞 Call</span>;
    if (val === "walk-in") return <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-200">🚶 Walk-in</span>;
    if (val === "whatsapp") return <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">💬 WA</span>;
    return <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">🌐 Website</span>;
  };

  return (
    <div className="space-y-6">
      {/* Stat Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Enquiries</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight">{stats.total}</span>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">📞 Call Enquiries</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-amber-600">{stats.calls}</span>
            <div className="rounded-full bg-amber-100 p-2 text-amber-600">
              <Phone className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">💬 Text Enquiries</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-blue-600">{stats.texts}</span>
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">🆕 New Leads</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-emerald-600">{stats.news}</span>
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
              <Smartphone className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Filter Stacks */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          <button
            onClick={() => setStackTab("all")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              stackTab === "all"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            All Enquiries ({stats.total})
          </button>
          <button
            onClick={() => setStackTab("call")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              stackTab === "call"
                ? "border-amber-500 text-amber-700"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Phone className="h-4 w-4 text-amber-500" />
            Call Stack ({stats.calls})
          </button>
          <button
            onClick={() => setStackTab("text")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              stackTab === "text"
                ? "border-blue-500 text-blue-700"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-4 w-4 text-blue-500" />
            Text Stack ({stats.texts})
          </button>
        </div>
      </div>

      {/* Filters and Actions Bar */}
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
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-soft"
        >
          <Plus className="h-4 w-4" />
          Add Enquiry
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="table-responsive-container rounded-2xl bg-card shadow-soft ring-1 ring-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3.5 text-left">Source</th>
                <th className="px-4 py-3.5 text-left">Customer Name</th>
                <th className="px-4 py-3.5 text-left">Phone Number</th>
                <th className="px-4 py-3.5 text-left hidden lg:table-cell">Linked Project</th>
                <th className="px-4 py-3.5 text-left hidden lg:table-cell">Budget</th>
                <th className="px-4 py-3.5 text-left">Lead Status</th>
                <th className="px-4 py-3.5 text-left hidden md:table-cell">Date</th>
                <th className="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    No matching enquiries found in this stack.
                  </td>
                </tr>
              )}
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  className="hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => setSelected(e)}
                >
                  <td className="px-4 py-3.5">{sourceBadge(e.source)}</td>
                  <td className="px-4 py-3.5 font-medium">{e.name}</td>
                  <td className="px-4 py-3.5 text-foreground/80">{e.phone}</td>
                  <td className="px-4 py-3.5 text-muted-foreground hidden lg:table-cell">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground/60" />
                      {e.project_name || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-foreground/80">{e.budget || "—"}</td>
                  <td className="px-4 py-3.5" onClick={(ev) => ev.stopPropagation()}>
                    <div className="relative inline-block">
                      <select
                        value={e.lead_status || "new"}
                        onChange={(ev) => updateStatus(e, ev.target.value)}
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6 ${statusColor(e.lead_status || "new")}`}
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
                  <td className="px-4 py-3.5 text-muted-foreground hidden md:table-cell text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground/60" />
                      {new Date(e.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right" onClick={(ev) => ev.stopPropagation()}>
                    <button
                      onClick={() => remove(e)}
                      className="rounded p-1.5 hover:bg-destructive/10 text-destructive transition-colors"
                      title="Delete enquiry"
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

      {/* Manual Enquiry Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Add New Enquiry
              </h2>
              <button onClick={() => setIsAddOpen(false)} className="rounded-full p-1 hover:bg-secondary">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            
            <form onSubmit={handleAddEnquiry} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  name="name"
                  required
                  placeholder="Enter customer name"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    required
                    placeholder="Enter phone number"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder="Enter email (optional)"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Enquiry Source
                  </label>
                  <select
                    name="source"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary text-foreground"
                  >
                    <option value="call">📞 Phone Call</option>
                    <option value="whatsapp">💬 WhatsApp</option>
                    <option value="walk-in">🚶 Walk-in Visit</option>
                    <option value="website">🌐 Website Form</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Budget Range
                  </label>
                  <select
                    name="budget"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary text-foreground"
                  >
                    <option value="">Select budget range</option>
                    <option value="Under ₹10L">Under ₹10 Lakhs</option>
                    <option value="₹10L–₹25L">₹10 – ₹25 Lakhs</option>
                    <option value="₹25L–₹50L">₹25 – ₹50 Lakhs</option>
                    <option value="₹50L–₹1Cr">₹50 Lakhs – ₹1 Crore</option>
                    <option value="Above ₹1Cr">Above ₹1 Crore</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Link to Project Layout
                </label>
                <select
                  name="project_id"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary text-foreground"
                >
                  <option value="">Associate with Project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Enquiry Message / Requirements
                </label>
                <textarea
                  name="message"
                  rows={3}
                  placeholder="What is the client looking for?"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-55"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail & Edit Drawer */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                Enquiry Details
                {sourceBadge(selected.source)}
              </h2>
              <button onClick={() => setSelected(null)} className="rounded-full p-1 hover:bg-secondary">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              {/* Quick Communication Grid */}
              <div className="grid grid-cols-2 gap-3 bg-secondary/40 p-3 rounded-xl border border-border/80">
                <a
                  href={`tel:${selected.phone}`}
                  className="flex items-center justify-center gap-2 rounded-lg bg-background py-2 text-xs font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-amber-500" />
                  Call Customer
                </a>
                <a
                  href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-background py-2 text-xs font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                  WhatsApp chat
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Client Name</span>
                  <div className="font-semibold text-foreground text-base mt-0.5">{selected.name}</div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone</span>
                  <div className="font-semibold text-foreground text-base mt-0.5">{selected.phone}</div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</span>
                  <div className="text-foreground mt-0.5">{selected.email || "—"}</div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Budget Range</span>
                  <div className="text-foreground mt-0.5">{selected.budget || "—"}</div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider font-semibold">Source Channel</span>
                  <div className="text-foreground mt-0.5 capitalize">{selected.source || "website"}</div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">Received Date</span>
                  <div className="text-foreground mt-0.5">
                    {new Date(selected.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </div>
                </div>
              </div>

              {/* Toggle to Select / Update Project Association */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Associated Project (Toggle & Link)
                </label>
                <div className="relative">
                  <select
                    value={selected.project_id || ""}
                    onChange={(e) => updateProjectLink(selected, e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary text-foreground appearance-none pr-8 font-medium"
                  >
                    <option value="">No Project Linked</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none opacity-60" />
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Original Message</span>
                <div className="mt-1 rounded-xl bg-secondary/50 px-3.5 py-2.5 text-foreground leading-relaxed border border-border">
                  {selected.message || "—"}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Internal Notes & History
                </label>
                <textarea
                  defaultValue={selected.notes || ""}
                  onBlur={(e) => updateNotes(selected, e.target.value)}
                  rows={4}
                  placeholder="Type notes here (autosaves on blur)…"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Lead status workflow
                </label>
                <select
                  value={selected.lead_status || "new"}
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

            <div className="flex justify-end mt-6 gap-3">
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
