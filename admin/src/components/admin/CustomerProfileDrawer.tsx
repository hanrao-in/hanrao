import React, { useState } from "react";
import { X, Phone, Mail, MapPin, Calendar, Building2, User, Clock, FileText, CheckCircle2, History } from "lucide-react";
import type { Customer, Enquiry, SiteVisit, Booking } from "@/lib/mockDb";

interface Props {
  customer: Customer | null;
  onClose: () => void;
  enquiries?: Enquiry[];
  siteVisits?: SiteVisit[];
  bookings?: Booking[];
}

export function CustomerProfileDrawer({ customer, onClose, enquiries = [], siteVisits = [], bookings = [] }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "enquiries" | "visits" | "bookings" | "notes">("overview");

  if (!customer) return null;

  const linkedEnquiries = enquiries.filter(
    (e) => ((e as any).customer_id && (e as any).customer_id === customer.id) || e.phone === customer.phone,
  );
  const linkedVisits = siteVisits.filter(
    (v) => ((v as any).customer_id && (v as any).customer_id === customer.id) || v.phone === customer.phone,
  );
  const linkedBookings = bookings.filter(
    (b) => b.customer_phone === customer.phone,
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-xl bg-card border-l border-border h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-secondary/20">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-foreground">{customer.name}</h2>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <span className="capitalize px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {customer.status || "Lead"}
                </span>
                <span>Source: {customer.source || "Website"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border bg-secondary/10 px-4 gap-1 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: User },
            { id: "enquiries", label: `Enquiries (${linkedEnquiries.length})`, icon: FileText },
            { id: "visits", label: `Site Visits (${linkedVisits.length})`, icon: Calendar },
            { id: "bookings", label: `Bookings (${linkedBookings.length})`, icon: Building2 },
            { id: "notes", label: "Activity Log", icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-border p-4 bg-background">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold">Phone</p>
                    <p className="text-sm font-medium">{customer.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold">Email</p>
                    <p className="text-sm font-medium">{customer.email || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-[10px] uppercase text-muted-foreground font-semibold">Address</p>
                    <p className="text-sm font-medium">{customer.address || "No address provided"}</p>
                  </div>
                </div>
              </div>

              {customer.notes && (
                <div className="rounded-xl border border-border p-4 bg-background space-y-1">
                  <p className="text-[10px] uppercase text-muted-foreground font-semibold">Executive Notes</p>
                  <p className="text-xs text-foreground whitespace-pre-wrap">{customer.notes}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "enquiries" && (
            <div className="space-y-3">
              {linkedEnquiries.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No linked enquiries found.</p>
              ) : (
                linkedEnquiries.map((e) => (
                  <div key={e.id} className="rounded-xl border border-border p-3.5 bg-background space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-primary">{e.project_name || "General Enquiry"}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</span>
                    </div>
                    {e.message && <p className="text-xs text-muted-foreground">{e.message}</p>}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "visits" && (
            <div className="space-y-3">
              {linkedVisits.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No site visits recorded.</p>
              ) : (
                linkedVisits.map((v) => (
                  <div key={v.id} className="rounded-xl border border-border p-3.5 bg-background space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold">{v.project_name}</span>
                      <span className="text-xs font-mono text-primary">{v.preferred_date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Status: <span className="capitalize font-medium">{v.status}</span></p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "bookings" && (
            <div className="space-y-3">
              {linkedBookings.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No bookings found for this customer.</p>
              ) : (
                linkedBookings.map((b) => (
                  <div key={b.id} className="rounded-xl border border-border p-3.5 bg-background space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-foreground">{b.project_name} - Plot #{b.plot_number}</span>
                      <span className="font-semibold text-emerald-600">₹{b.paid_amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Date: {b.booking_date}</span>
                      <span className="capitalize text-emerald-700 font-medium">{b.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-xl border border-border p-3 bg-secondary/20">
                <Clock className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-semibold">Customer Record Created</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(customer.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
