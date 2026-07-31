import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type Booking } from "@/lib/adminDb";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, X, IndianRupee, Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState<null | "create" | Booking>(null);
  const [form, setForm] = useState<BookingForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const data = await adminDb.bookings.list();
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
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statusColor = (s: string) =>
    s === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : s === "partial"
        ? "bg-blue-50 text-blue-700"
        : s === "cancelled"
          ? "bg-red-50 text-red-700"
          : "bg-amber-50 text-amber-700";

  const totalRevenue = filtered
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + Number(b.paid_amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search bookings…"
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
          <span className="self-center text-sm text-muted-foreground">
            {filtered.length} booking{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-sm font-medium text-emerald-600">
            <IndianRupee className="h-4 w-4" />
            {(totalRevenue / 100000).toFixed(1)} L collected
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add Booking
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Project / Plot</th>
                <th className="px-4 py-3 text-left hidden lg:table-cell">Total</th>
                <th className="px-4 py-3 text-left">Paid</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left hidden md:table-cell">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No bookings found.
                  </td>
                </tr>
              )}
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{b.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{b.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div>{b.project_name || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {b.plot_number ? `Plot ${b.plot_number}` : "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    ₹{(Number(b.total_amount) / 100000).toFixed(1)}L
                  </td>
                  <td className="px-4 py-3 text-emerald-600 font-medium">
                    ₹{(Number(b.paid_amount) / 100000).toFixed(1)}L
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusColor(b.status)}`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-xs text-muted-foreground">
                    {new Date(b.booking_date + "T00:00:00").toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEdit(b)}
                        className="rounded p-1.5 hover:bg-secondary"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => remove(b)}
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

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold">
                {modal === "create" ? "Add Booking" : "Edit Booking"}
              </h2>
              <button onClick={closeModal}>
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3">
              {(
                [
                  ["customer_name", "Customer Name"],
                  ["customer_phone", "Phone"],
                  ["project_name", "Project"],
                  ["plot_number", "Plot Number"],
                ] as const
              ).map(([k, label]) => (
                <div key={k}>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </label>
                  <input
                    value={(form as any)[k]}
                    onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Total Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={form.total_amount}
                    onChange={(e) => setForm((f) => ({ ...f, total_amount: +e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Paid Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={form.paid_amount}
                    onChange={(e) => setForm((f) => ({ ...f, paid_amount: +e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as any }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s} className="capitalize">
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={closeModal}
                className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {modal === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
