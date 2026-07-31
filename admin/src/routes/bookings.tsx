import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type Booking, type Project } from "@/lib/adminDb";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  IndianRupee,
  Loader2,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Phone,
  MessageSquare,
  Building2,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/bookings")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Bookings · Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => (
    <AdminShell title="Bookings">
      <Bookings />
    </AdminShell>
  ),
});

type BookingForm = Omit<Booking, "id" | "created_at">;
const EMPTY_FORM: BookingForm = {
  customer_name: "",
  customer_phone: "",
  project_name: "",
  plot_number: "",
  total_amount: 0,
  paid_amount: 0,
  status: "advance",
  booking_date: new Date().toISOString().split("T")[0],
};

const STATUSES = ["advance", "partial", "completed", "cancelled"] as const;

function Bookings() {
  const [items, setItems] = useState<Booking[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState<null | "create" | Booking>(null);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const [bookingsData, projectsData] = await Promise.all([
        adminDb.bookings.list(),
        adminDb.projects.list(),
      ]);
      setItems(bookingsData);
      setProjects(projectsData);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((b) => b.status !== "cancelled").length;
    const completed = items.filter((b) => b.status === "completed").length;
    const totalRevenue = items
      .filter((b) => b.status !== "cancelled")
      .reduce((s, b) => s + Number(b.paid_amount || 0), 0);
    return { total, active, completed, totalRevenue };
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((b) => {
        const matchSearch =
          b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
          (b.project_name || "").toLowerCase().includes(search.toLowerCase()) ||
          (b.plot_number || "").includes(search);
        const matchStatus = statusFilter === "all" || b.status === statusFilter;
        return matchSearch && matchStatus;
      }),
    [items, search, statusFilter],
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal("create");
  };

  const openEdit = (b: Booking) => {
    setForm({
      customer_name: b.customer_name,
      customer_phone: b.customer_phone,
      project_name: b.project_name || "",
      plot_number: b.plot_number || "",
      total_amount: b.total_amount,
      paid_amount: b.paid_amount,
      status: b.status,
      booking_date: b.booking_date,
    });
    setModal(b);
  };

  const closeModal = () => setModal(null);

  const save = async () => {
    if (!form.customer_name.trim()) {
      toast.error("Customer name required");
      return;
    }
    setSaving(true);
    try {
      if (modal === "create") {
        await adminDb.bookings.create(form);
        toast.success("Booking created");
      } else if (modal) {
        await adminDb.bookings.update((modal as Booking).id, form);
        toast.success("Booking updated");
      }
      await fetchItems();
      closeModal();
      if (selected) {
        const updated = items.find((x) => x.id === (modal as Booking).id);
        if (updated) setSelected(updated);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (b: Booking) => {
    if (!confirm(`Delete booking for ${b.customer_name}?`)) return;
    try {
      await adminDb.bookings.delete(b.id);
      await fetchItems();
      setSelected(null);
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statusColor = (s: string) =>
    s === "completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "partial"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : s === "cancelled"
          ? "bg-red-50 text-red-700 border-red-200"
          : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Bookings</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight">{stats.total}</span>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Revenue</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold tracking-tight text-emerald-600">
              ₹{stats.totalRevenue.toLocaleString("en-IN")}
            </span>
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
              <IndianRupee className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">🟢 Active Bookings</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-blue-600">{stats.active}</span>
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <CreditCard className="h-4 w-4" />
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

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, project or plot…"
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
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {stats.total} bookings
          </span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Booking
        </button>
      </div>

      {/* Main Table Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3.5 text-left">Customer</th>
                <th className="px-4 py-3.5 text-left hidden md:table-cell">Project / Plot</th>
                <th className="px-4 py-3.5 text-left">Paid / Total Amount</th>
                <th className="px-4 py-3.5 text-left">Date</th>
                <th className="px-4 py-3.5 text-left">Status</th>
                <th className="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No bookings found.
                  </td>
                </tr>
              )}
              {filtered.map((b) => (
                <tr
                  key={b.id}
                  className="hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => setSelected(b)}
                >
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-foreground">{b.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{b.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="font-medium text-foreground">{b.project_name || "—"}</div>
                    {b.plot_number && (
                      <div className="text-xs text-muted-foreground">Plot No. {b.plot_number}</div>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-foreground">
                      ₹{b.paid_amount.toLocaleString("en-IN")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      of ₹{b.total_amount.toLocaleString("en-IN")}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {new Date(b.booking_date + "T00:00:00").toLocaleDateString("en-IN", {
                      dateStyle: "medium",
                    })}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor(
                        b.status,
                      )}`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEdit(b)}
                        className="rounded p-1.5 hover:bg-secondary transition-colors"
                        title="Edit booking"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => remove(b)}
                        className="rounded p-1.5 hover:bg-destructive/10 text-destructive transition-colors"
                        title="Delete booking"
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

      {/* Drawer Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                Booking Details
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(
                    selected.status,
                  )}`}
                >
                  {selected.status}
                </span>
              </h2>
              <button onClick={() => setSelected(null)} className="rounded-full p-1 hover:bg-secondary">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              {/* Communication Links */}
              <div className="grid grid-cols-2 gap-3 bg-secondary/40 p-3 rounded-xl border border-border/80">
                <a
                  href={`tel:${selected.customer_phone}`}
                  className="flex items-center justify-center gap-2 rounded-lg bg-background py-2 text-xs font-semibold border border-border text-foreground hover:bg-secondary transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-amber-500" />
                  Call Customer
                </a>
                <a
                  href={`https://wa.me/${selected.customer_phone.replace(/[^0-9]/g, "")}`}
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
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Customer Name
                  </span>
                  <div className="font-semibold text-foreground text-base mt-0.5">
                    {selected.customer_name}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Phone
                  </span>
                  <div className="font-semibold text-foreground text-base mt-0.5">
                    {selected.customer_phone}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Project
                  </span>
                  <div className="text-foreground font-medium mt-0.5">
                    {selected.project_name || "—"}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Plot No.
                  </span>
                  <div className="text-foreground font-medium mt-0.5">
                    {selected.plot_number || "—"}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-border bg-secondary/20 space-y-2">
                <div className="flex justify-between items-center text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  <span>Payment Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Paid Amount:</span>
                    <p className="font-bold text-emerald-600 text-lg">
                      ₹{selected.paid_amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total Price:</span>
                    <p className="font-bold text-foreground text-lg">
                      ₹{selected.total_amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                {/* Balance Progress Bar */}
                <div className="w-full bg-secondary rounded-full h-2 mt-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (Number(selected.paid_amount) / Math.max(1, Number(selected.total_amount))) *
                          100,
                      )}%`,
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground pt-1">
                  <span>
                    Progress:{" "}
                    {Math.round(
                      (Number(selected.paid_amount) / Math.max(1, Number(selected.total_amount))) *
                        100,
                    )}
                    %
                  </span>
                  <span>
                    Balance: ₹{(selected.total_amount - selected.paid_amount).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Booking Date:</span>
                <span className="font-medium">
                  {new Date(selected.booking_date + "T00:00:00").toLocaleDateString("en-IN", {
                    weekday: "short",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setSelected(null);
                  openEdit(selected);
                }}
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-secondary transition-colors"
              >
                Edit Booking
              </button>
              <button
                onClick={() => setSelected(null)}
                className="rounded-full bg-secondary border border-border px-5 py-2 text-sm font-semibold hover:bg-secondary/80 transition-colors text-foreground"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Form Dialog Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-foreground">
                {modal === "create" ? "Add Booking" : "Edit Booking"}
              </h2>
              <button onClick={closeModal} className="rounded-full p-1 hover:bg-secondary">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Customer Name
                </label>
                <input
                  value={form.customer_name}
                  onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
                  placeholder="e.g. Rajesh Kumar"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Customer Phone
                </label>
                <input
                  value={form.customer_phone}
                  onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
                  placeholder="e.g. +91 9876543210"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Project
                  </label>
                  <select
                    value={form.project_name}
                    onChange={(e) => setForm((f) => ({ ...f, project_name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Select Project</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Plot Number
                  </label>
                  <input
                    value={form.plot_number}
                    onChange={(e) => setForm((f) => ({ ...f, plot_number: e.target.value }))}
                    placeholder="e.g. 104"
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Paid Amount (₹)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.paid_amount === 0 ? "" : String(form.paid_amount)}
                    placeholder="e.g. 50000"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*\.?\d*$/.test(val))
                        setForm((f) => ({ ...f, paid_amount: val === "" ? 0 : +val }));
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Total Amount (₹)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={form.total_amount === 0 ? "" : String(form.total_amount)}
                    placeholder="e.g. 150000"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*\.?\d*$/.test(val))
                        setForm((f) => ({ ...f, total_amount: val === "" ? 0 : +val }));
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Booking Date
                  </label>
                  <input
                    type="date"
                    value={form.booking_date}
                    onChange={(e) => setForm((f) => ({ ...f, booking_date: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-secondary disabled:opacity-50 text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {modal === "create" ? "Create" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
