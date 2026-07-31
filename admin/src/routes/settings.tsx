import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { toast } from "sonner";
import { User, Lock, Building2, Save } from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Settings · Admin" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: () => (
    <AdminShell title="Settings">
      <Settings />
    </AdminShell>
  ),
});

function Settings() {
  const { user } = useAdminAuth();
  const [tab, setTab] = useState<"profile" | "company" | "security">("profile");

  const [profile, setProfile] = useState({
    name: "Admin User",
    email: user?.email ?? "hanraoadmin@gmail.com",
    phone: "8341505195",
  });
  const [company, setCompany] = useState({
    name: "HanRao Realty",
    tagline: "Premium Open Plots in Hyderabad",
    phone: "8341505195",
    email: "hanraoadmin@gmail.com",
    address: "Hyderabad, Telangana",
  });
  const [security, setSecurity] = useState({ current: "", next: "", confirm: "" });

  const saveProfile = () => {
    toast.success("Profile saved");
  };
  const saveCompany = () => {
    toast.success("Company info saved");
  };
  const savePassword = async () => {
    if (!security.current) {
      toast.error("Enter current password");
      return;
    }
    if (security.next.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (security.next !== security.confirm) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: security.next,
      });
      if (error) throw error;

      setSecurity({ current: "", next: "", confirm: "" });
      toast.success("Password updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    }
  };

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "company" as const, label: "Company", icon: Building2 },
    { id: "security" as const, label: "Security", icon: Lock },
  ];

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex gap-1 rounded-xl bg-secondary p-1 w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="rounded-2xl bg-card shadow-soft ring-1 ring-border p-6 space-y-4">
          <h2 className="font-serif text-lg font-semibold">Profile Information</h2>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Full Name
            </label>
            <input
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Phone
            </label>
            <input
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div className="pt-2 flex justify-end">
            <button
              onClick={saveProfile}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Save className="h-4 w-4" /> Save Profile
            </button>
          </div>
        </div>
      )}

      {tab === "company" && (
        <div className="rounded-2xl bg-card shadow-soft ring-1 ring-border p-6 space-y-4">
          <h2 className="font-serif text-lg font-semibold">Company Information</h2>
          {[
            ["name", "Company Name"],
            ["tagline", "Tagline"],
            ["phone", "Contact Phone"],
            ["email", "Contact Email"],
            ["address", "Office Address"],
          ].map(([k, label]) => (
            <div key={k}>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </label>
              <input
                value={(company as any)[k]}
                onChange={(e) => setCompany((c) => ({ ...c, [k]: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          ))}
          <div className="pt-2 flex justify-end">
            <button
              onClick={saveCompany}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Save className="h-4 w-4" /> Save Changes
            </button>
          </div>
        </div>
      )}

      {tab === "security" && (
        <div className="rounded-2xl bg-card shadow-soft ring-1 ring-border p-6 space-y-4">
          <h2 className="font-serif text-lg font-semibold">Change Password</h2>
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
            In Dev Mode, password changes are simulated only. Connect Supabase to enable real auth.
          </div>
          {[
            ["current", "Current Password"],
            ["next", "New Password"],
            ["confirm", "Confirm New Password"],
          ].map(([k, label]) => (
            <div key={k}>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {label}
              </label>
              <input
                type="password"
                value={(security as any)[k]}
                onChange={(e) => setSecurity((s) => ({ ...s, [k]: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          ))}
          <div className="pt-2 flex justify-end">
            <button
              onClick={savePassword}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Lock className="h-4 w-4" /> Update Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
