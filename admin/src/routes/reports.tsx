import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  adminDb,
  type Enquiry,
  type Booking,
  type Plot,
  type Customer,
  type SiteVisit,
} from "@/lib/adminDb";
import { FileText, FileSpreadsheet, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/reports")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Reports · Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => (
    <AdminShell title="Reports">
      <Reports />
    </AdminShell>
  ),
});

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`${filename} downloaded`);
}

function Reports() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [enqs, bks, pls, custs, vsts] = await Promise.all([
          adminDb.enquiries.list(),
          adminDb.bookings.list(),
          adminDb.plots.list(),
          adminDb.customers.list(),
          adminDb.siteVisits.list(),
        ]);
        setEnquiries(enqs);
        setBookings(bks);
        setPlots(pls);
        setCustomers(custs);
        setVisits(vsts);
      } catch (err: any) {
        toast.error("Failed to load reports: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const reports = [
    {
      title: "Enquiries Report",
      desc: `${enquiries.length} total enquiries with lead status breakdown.`,
      onCsv: () =>
        downloadCSV(
          "enquiries_report.csv",
          ["Name", "Phone", "Email", "Project", "Budget", "Status", "Date"],
          enquiries.map((e) => [
            e.name,
            e.phone,
            e.email || "",
            e.project_name || "",
            e.budget || "",
            e.lead_status || "",
            new Date(e.created_at).toLocaleDateString("en-IN"),
          ]),
        ),
    },
    {
      title: "Bookings Report",
      desc: `${bookings.length} bookings · ₹${(bookings.reduce((s, b) => s + b.paid_amount, 0) / 100000).toFixed(1)}L collected.`,
      onCsv: () =>
        downloadCSV(
          "bookings_report.csv",
          ["Customer", "Phone", "Project", "Plot", "Total", "Paid", "Status", "Date"],
          bookings.map((b) => [
            b.customer_name,
            b.customer_phone,
            b.project_name || "",
            b.plot_number || "",
            b.total_amount.toString(),
            b.paid_amount.toString(),
            b.status,
            b.booking_date,
          ]),
        ),
    },
    {
      title: "Plot Inventory",
      desc: `${plots.filter((p) => p.availability === "available").length} available, ${plots.filter((p) => p.availability === "sold").length} sold.`,
      onCsv: () =>
        downloadCSV(
          "plots_inventory.csv",
          ["Plot No.", "Project", "Area (SqYd)", "Price/SqYd", "Facing", "Type", "Availability"],
          plots.map((p) => [
            p.plot_number,
            p.project_name,
            p.area_sqyd.toString(),
            p.price_per_sqyd.toString(),
            p.facing,
            p.plot_type,
            p.availability,
          ]),
        ),
    },
    {
      title: "Customer List",
      desc: `${customers.length} customers across all sources.`,
      onCsv: () =>
        downloadCSV(
          "customers_list.csv",
          ["Name", "Phone", "Email", "Address", "Source", "Status"],
          customers.map((c) => [
            c.name,
            c.phone,
            c.email || "",
            c.address || "",
            c.source,
            c.status,
          ]),
        ),
    },
    {
      title: "Site Visits",
      desc: `${visits.length} visits · ${visits.filter((v) => v.status === "completed").length} completed.`,
      onCsv: () =>
        downloadCSV(
          "site_visits.csv",
          ["Name", "Phone", "Project", "Date", "Time", "Status"],
          visits.map((v) => [
            v.name,
            v.phone,
            v.project_name || "",
            v.preferred_date,
            v.preferred_time,
            v.status,
          ]),
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Download reports as CSV. PDF export will be available when connected to Supabase.
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((r) => (
          <div key={r.title} className="rounded-2xl bg-card shadow-soft ring-1 ring-border p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{r.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={r.onCsv}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium border border-border px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" /> CSV
              </button>
              <button
                onClick={() => toast.info("PDF export requires Supabase connection")}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium border border-border px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-red-500" /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quick summary */}
      <div className="rounded-2xl bg-card shadow-soft ring-1 ring-border p-5">
        <h2 className="font-serif text-lg font-semibold mb-4">Summary</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="text-muted-foreground text-xs">Total Enquiries</div>
            <div className="text-xl font-semibold mt-1">{enquiries.length}</div>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="text-muted-foreground text-xs">Converted</div>
            <div className="text-xl font-semibold mt-1 text-emerald-600">
              {enquiries.filter((e) => e.lead_status === "converted").length}
            </div>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="text-muted-foreground text-xs">Revenue Collected</div>
            <div className="text-xl font-semibold mt-1 text-emerald-600">
              ₹{(bookings.reduce((s, b) => s + b.paid_amount, 0) / 100000).toFixed(1)}L
            </div>
          </div>
          <div className="rounded-lg bg-secondary/50 p-3">
            <div className="text-muted-foreground text-xs">Plots Sold</div>
            <div className="text-xl font-semibold mt-1">
              {plots.filter((p) => p.availability === "sold").length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
