import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportError } from "../lib/error-reporting";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FloatingActions } from "@/components/FloatingActions";

import { AnalyticsProvider } from "@/components/AnalyticsProvider";
import { trackEvent, trackException } from "@/lib/analytics";

function NotFoundComponent() {
  useEffect(() => {
    trackEvent("404_page_view", { page_path: window.location.pathname });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-7xl font-semibold text-primary">404</h1>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    trackException(error, { fatal: false });
    reportError(
      error,
      { boundary: "tanstack_root_error_component" },
      { mechanism: "react_error_boundary", handled: false, severity: "error" },
    );
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-full border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // ── Primary SEO ──────────────────────────────────────────────────────────
      { title: "HanRao Realty — Premium Open Plots in Hyderabad" },
      {
        name: "description",
        content:
          "HanRao Realty offers premium HMDA, DTCP and RERA approved open plots, villa plots and farm land for sale across Hyderabad, Shamshabad, Sangareddy and Kompally.",
      },
      {
        name: "keywords",
        content:
          "HanRao Realty, open plots hyderabad, HMDA plots, DTCP plots, RERA approved plots, gated community plots, Shamshabad plots, Sangareddy plots, Kompally plots, real estate hyderabad",
      },
      { name: "author", content: "HanRao Realty" },
      { name: "robots", content: "index, follow" },
      // ── Open Graph ───────────────────────────────────────────────────────────
      { property: "og:type", content: "website" },
      { property: "og:title", content: "HanRao Realty — Premium Open Plots in Hyderabad" },
      {
        property: "og:description",
        content:
          "Explore premium HMDA, DTCP and RERA approved gated community open plots across Hyderabad.",
      },
      { property: "og:url", content: "https://hanrao.in" },
      { property: "og:image", content: "https://hanrao.in/og-image.png" },
      // ── Twitter Card ─────────────────────────────────────────────────────────
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "HanRao Realty — Premium Open Plots in Hyderabad" },
      {
        name: "twitter:description",
        content:
          "Explore premium HMDA, DTCP and RERA approved gated community open plots across Hyderabad.",
      },
      { name: "twitter:image", content: "https://hanrao.in/og-image.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // ── Icons & Manifest ─────────────────────────────────────────────────────
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      // ── Canonical ────────────────────────────────────────────────────────────
      { rel: "canonical", href: "https://hanrao.in" },
    ],
    scripts: [
      // ── RealEstateAgent Structured Data (JSON-LD) ─────────────────────────────
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "RealEstateAgent",
          name: "HanRao Realty",
          url: "https://hanrao.in",
          logo: "https://hanrao.in/favicon.png",
          image: "https://hanrao.in/og-image.png",
          description:
            "Premium HMDA, DTCP & RERA approved open plots, villa plots, and farm lands for sale across Hyderabad.",
          telephone: "+918341505195",
          address: {
            "@type": "PostalAddress",
            addressLocality: "Hyderabad",
            addressRegion: "Telangana",
            addressCountry: "IN",
          },
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

import { OfflineBanner } from "@/components/OfflineBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AnalyticsProvider>
        <ErrorBoundary>
          <div className="flex min-h-screen flex-col overflow-x-hidden">
            <OfflineBanner />
            <SiteHeader />
            <main className="flex-1">
              <Outlet />
            </main>
            <SiteFooter />
            <FloatingActions />
            <Toaster position="top-center" richColors />
          </div>
        </ErrorBoundary>
      </AnalyticsProvider>
    </QueryClientProvider>
  );
}
