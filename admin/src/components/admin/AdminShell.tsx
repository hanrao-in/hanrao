import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Building2,
  MapPinned,
  Users,
  MessageSquare,
  CalendarCheck,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { adminDb } from "@/lib/adminDb";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: Building2 },
  { to: "/plots", label: "Plot Management", icon: MapPinned },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/enquiries", label: "Enquiries", icon: MessageSquare },
  { to: "/notifications", label: "Site Visits", icon: CalendarCheck },
  { to: "/bookings", label: "Bookings", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AdminShell({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, loading, signOut } = useAdminAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [user, loading, navigate]);

  // Show unchecked site visits count in header and sidebar badges
  useEffect(() => {
    if (!user) return;
    const fetchPending = async () => {
      try {
        const visits = await adminDb.siteVisits.list();
        setUnreadCount(visits.filter((v) => !v.checked).length);
      } catch {
        // silently ignore — badge is non-critical
      }
    };
    fetchPending();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    navigate({ to: "/login", replace: true });
  };

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-secondary/30">
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 shrink-0 transform border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <Link to="/dashboard" className="font-serif text-xl font-semibold text-primary">
            HanRao Admin
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="mt-2 px-3 overflow-y-auto h-[calc(100vh-140px)]">
          {NAV.map((n) => {
            const active = pathname === n.to || pathname.startsWith(n.to + "/");
            const isNotifications = n.to === "/notifications";
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/80 hover:bg-secondary"
                }`}
              >
                <n.icon className="h-4 w-4 shrink-0" />
                {n.label}
                {isNotifications && unreadCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 border-t border-border p-4">
          <div className="mb-2 truncate text-xs text-muted-foreground">{user.email}</div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-secondary"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-serif text-xl font-semibold">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/notifications"
              className="relative rounded-lg p-2 hover:bg-secondary"
              aria-label="Site Visits"
            >
              <CalendarCheck className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <a
              href="https://hanrao-prime-portal.onrender.com"
              className="text-xs text-muted-foreground hover:underline hidden sm:block"
            >
              ← Public Site
            </a>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
