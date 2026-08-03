import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type Customer } from "@/lib/adminDb";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Loader2,
  Users,
  Award,
  Sparkles,
  Phone,
  MessageSquare,
  UserCheck,
  Mail,
  MapPin,
  FileText,
} from "lucide-react";

import { CustomerProfileDrawer } from "@/components/admin/CustomerProfileDrawer";
import { Download } from "lucide-react";

export const Route = createFileRoute("/customers")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Customers · Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => (
    <AdminShell title="Customers">
      <Customers />
    </AdminShell>
  ),
});

type CustomerForm = Omit<Customer, "id" | "created_at">;
const EMPTY_FORM: CustomerForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  source: "website",
  status: "lead",
  notes: "",
};

const STATUSES = ["lead", "prospect", "customer", "inactive"] as const;
const SOURCES = ["website", "referral", "walk-in", "social"] as const;

function Customers() {
  const [items, setItems] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [modal, setModal] = useState<null | "create" | Customer>(null);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [form, setForm] = useState<CustomerForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    try {
      const data = await adminDb.customers.list();
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

  const stats = useMemo(() => {
    const total = items.length;
    const leads = items.filter((c) => c.status === "lead").length;
    const prospects = items.filter((c) => c.status === "prospect").length;
    const customers = items.filter((c) => c.status === "customer").length;
    return { total, leads, prospects, customers };
  }, [items]);

  const filtered = useMemo(
    () =>
      items.filter((c) => {
        const matchSearch =
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.phone.includes(search) ||
          (c.email || "").toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || c.status === statusFilter;
        const matchSource = sourceFilter === "all" || c.source === sourceFilter;
        return matchSearch && matchStatus && matchSource;
      }),
    [items, search, statusFilter, sourceFilter],
  );

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal("create");
  };

  const openEdit = (c: Customer) => {
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email || "",
      address: c.address || "",
      source: c.source,
      status: c.status,
      notes: c.notes || "",
    });
    setModal(c);
  };

  const closeModal = () => setModal(null);

  const save = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("Name and phone required");
      return;
    }
    setSaving(true);
    try {
      if (modal === "create") {
        await adminDb.customers.create(form);
        toast.success("Customer added");
      } else if (modal) {
        await adminDb.customers.update((modal as Customer).id, form);
        toast.success("Customer updated");
      }
      await fetchItems();
      closeModal();
      if (selected) {
        const updated = items.find((x) => x.id === (modal as Customer).id);
        if (updated) setSelected(updated);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: Customer) => {
    if (!confirm(`Delete customer ${c.name}?`)) return;
    try {
      await adminDb.customers.delete(c.id);
      await fetchItems();
      setSelected(null);
      toast.success("Deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const statusColor = (s: string) =>
    s === "customer"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "prospect"
        ? "bg-blue-50 text-blue-700 border-blue-200"
        : s === "inactive"
          ? "bg-gray-100 text-gray-600 border-gray-200"
          : "bg-amber-50 text-amber-700 border-amber-200";

  const sourceLabel = (s: string) =>
    ({ website: "Website", referral: "Referral", "walk-in": "Walk-in", social: "Social" })[s] ?? s;

  return (
    <div className="space-y-6">
      {/* Stat Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Contacts</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight">{stats.total}</span>
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              <Users className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">🟢 Active Leads</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-amber-600">{stats.leads}</span>
            <div className="rounded-full bg-amber-100 p-2 text-amber-600">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">🔵 Prospects</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-blue-600">{stats.prospects}</span>
            <div className="rounded-full bg-blue-100 p-2 text-blue-600">
              <Award className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">🏆 Converted Customers</p>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-3xl font-semibold tracking-tight text-emerald-600">{stats.customers}</span>
            <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email…"
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
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="all">All Sources</option>
            {SOURCES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {sourceLabel(s)}
              </option>
            ))}
          </select>
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {stats.total} contacts
          </span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-card shadow-soft ring-1 ring-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3.5 text-left">Name</th>
                <th className="px-4 py-3.5 text-left hidden md:table-cell">Contact Details</th>
                <th className="px-4 py-3.5 text-left hidden lg:table-cell">Source</th>
                <th className="px-4 py-3.5 text-left">Status</th>
                <th className="px-4 py-3.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    No customers found.
                  </td>
                </tr>
              )}
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => setSelected(c)}
                >
                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-foreground">{c.name}</div>
                    <div className="text-xs text-muted-foreground md:hidden">{c.phone}</div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="font-medium text-foreground">{c.phone}</div>
                    {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-muted-foreground">
                    {sourceLabel(c.source)}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor(
                        c.status,
                      )}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded p-1.5 hover:bg-secondary transition-colors"
                        title="Edit customer"
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => remove(c)}
                        className="rounded p-1.5 hover:bg-destructive/10 text-destructive transition-colors"
                        title="Delete customer"
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
                Customer Details
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
              {/* Quick Communication Actions */}
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
                  WhatsApp
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Full Name
                  </span>
                  <div className="font-semibold text-foreground text-base mt-0.5">
                    {selected.name}
                  </div>
                </div>
                <div>
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Phone Number
                  </span>
                  <div className="font-semibold text-foreground text-base mt-0.5">
                    {selected.phone}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Email Address
                  </span>
                  <div className="text-foreground mt-0.5 flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground/60" />
                    {selected.email ? (
                      <a href={`mailto:${selected.email}`} className="hover:underline text-primary">
                        {selected.email}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Source
                  </span>
                  <div className="text-foreground mt-0.5 capitalize">
                    {sourceLabel(selected.source)}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Address
                  </span>
                  <div className="text-foreground mt-0.5 flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 mt-0.5" />
                    <span>{selected.address || "—"}</span>
                  </div>
                </div>
              </div>

              {selected.notes && (
                <div className="p-3.5 rounded-xl border border-border bg-secondary/20 space-y-1">
                  <span className="block text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground/60" /> Notes
                  </span>
                  <p className="text-foreground/95 leading-relaxed whitespace-pre-wrap">
                    {selected.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setSelected(null);
                  openEdit(selected);
                }}
                className="rounded-full border border-border px-5 py-2 text-sm font-semibold hover:bg-secondary transition-colors"
              >
                Edit Customer
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

      {/* Customer Form Dialog Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl ring-1 ring-border overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-foreground">
                {modal === "create" ? "Add Customer" : "Edit Customer"}
              </h2>
              <button onClick={closeModal} className="rounded-full p-1 hover:bg-secondary">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Full Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Anand Sharma"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Phone Number
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="e.g. +91 9876543210"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Email Address
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="e.g. anand@example.com"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Address
                </label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="e.g. Flat 302, Green Meadows, Hyderabad"
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Lead Source
                  </label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as any }))}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    {SOURCES.map((s) => (
                      <option key={s} value={s}>
                        {sourceLabel(s)}
                      </option>
                    ))}
                  </select>
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

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Add any specific requirements or conversation summary..."
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
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
