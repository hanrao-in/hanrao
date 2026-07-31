import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminDb, type Booking, type Enquiry } from "@/lib/adminDb";
import {
  TrendingUp,
  IndianRupee,
  BookOpen,
  MapPinned,
  Users,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/sales")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Sales · Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => (
    <AdminShell title="Sales Overview">
      <Sales />
    </AdminShell>
  ),
});

type Stats = Awaited<ReturnType<typeof adminDb.stats>>;

function Analytics() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [s, bks, enqs] = await Promise.all([
          adminDb.stats(),
          adminDb.bookings.list(),
          adminDb.enquiries.list(),
        ]);
        setStats(s);
        setBookings(bks);
        setEnquiries(enqs);
      } catch (err: any) {
        toast.error("Failed to load sales: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const completedBookings = bookings.filter((b) => b.status === "completed");
  const totalRevenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + b.paid_amount, 0);
  const pendingRevenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((s, b) => s + (b.total_amount - b.paid_amount), 0);

  const conversionRate =
    enquiries.length > 0
      ? Math.round(
          (enquiries.filter((e) => e.lead_status === "converted").length / enquiries.length) * 100,
        )
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          label="Revenue Collected"
          value={`₹${(totalRevenue / 100000).toFixed(1)}L`}
          icon={IndianRupee}
          color="text-emerald-600 bg-emerald-50"
        />
        <Metric
          label="Pending Revenue"
          value={`₹${(pendingRevenue / 100000).toFixed(1)}L`}
          icon={TrendingUp}
          color="text-amber-600 bg-amber-50"
        />
        <Metric
          label="Completed Sales"
          value={completedBookings.length}
          icon={BookOpen}
          color="text-blue-600 bg-blue-50"
        />
        <Metric
          label="Plots Sold"
          value={stats.plotsSold}
          icon={MapPinned}
          color="text-purple-600 bg-purple-50"
        />
        <Metric
          label="Lead Conversion"
          value={`${conversionRate}%`}
          icon={Users}
          color="text-rose-600 bg-rose-50"
        />
        <Metric
          label="Total Enquiries"
          value={stats.enquiries}
          icon={MessageSquare}
          color="text-indigo-600 bg-indigo-50"
        />
      </div>

      {/* Bookings table */}
      <div className="rounded-2xl bg-card shadow-soft ring-1 ring-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-serif text-lg font-semibold">All Bookings</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left hidden md:table-cell">Project</th>
              <th className="px-4 py-3 text-left">Total</th>
              <th className="px-4 py-3 text-left">Paid</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No bookings found.
                </td>
              </tr>
            )}
            {bookings.map((b) => (
              <tr key={b.id} className="hover:bg-secondary/30">
                <td className="px-4 py-3 font-medium">{b.customer_name}</td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  {b.project_name} · {b.plot_number}
                </td>
                <td className="px-4 py-3">₹{(b.total_amount / 100000).toFixed(1)}L</td>
                <td className="px-4 py-3 text-emerald-600">
                  ₹{(b.paid_amount / 100000).toFixed(1)}L
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                      b.status === "completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : b.status === "cancelled"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pipeline */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-card shadow-soft ring-1 ring-border p-5">
          <h2 className="font-serif text-lg font-semibold mb-4">Lead Pipeline</h2>
          {["new", "contacted", "interested", "visited", "converted", "lost"].map((status) => {
            const count = enquiries.filter((e) => e.lead_status === status).length;
            const pct = enquiries.length > 0 ? (count / enquiries.length) * 100 : 0;
            return (
              <div key={status} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize font-medium">{status}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="rounded-2xl bg-card shadow-soft ring-1 ring-border p-5">
          <h2 className="font-serif text-lg font-semibold mb-4">Plot Availability</h2>
          {[
            { label: "Available", count: stats.plotsAvailable, color: "bg-emerald-500" },
            { label: "Reserved", count: stats.plotsReserved, color: "bg-amber-500" },
            { label: "Sold", count: stats.plotsSold, color: "bg-gray-400" },
          ].map(({ label, count, color }) => {
            const pct = stats.plots > 0 ? (count / stats.plots) * 100 : 0;
            return (
              <div key={label} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{label}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Sales() {
  return <Analytics />;
}

function Metric({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-5 shadow-soft ring-1 ring-border">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className={`rounded-full p-2 ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 font-serif text-2xl font-semibold">{value}</div>
    </div>
  );
}
