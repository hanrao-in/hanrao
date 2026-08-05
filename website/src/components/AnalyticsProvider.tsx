import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";
import {
  initializeAnalytics,
  trackPageView,
  trackEvent,
  updateConsent,
  setUserProperties,
  trackException,
  type CustomEventName,
  type EventParams,
  type ConsentState,
} from "@/lib/analytics";

interface AnalyticsContextType {
  trackEvent: (eventName: CustomEventName | string, params?: EventParams) => void;
  updateConsent: (consent: Partial<ConsentState>) => void;
  setUserProperties: (properties: Record<string, any>) => void;
  trackException: (error: Error | string, details?: { fatal?: boolean }) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  trackEvent,
  updateConsent,
  setUserProperties,
  trackException,
});

export function useAnalytics() {
  return useContext(AnalyticsContext);
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const trackedScrollDepths = useRef<Set<number>>(new Set());

  // 1. Initialize Analytics strictly once
  useEffect(() => {
    initializeAnalytics();
  }, []);

  // 2. Track Route Changes (pathname + search + hash)
  useEffect(() => {
    const fullRoute =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}${window.location.hash}`
        : location.pathname;
    trackPageView(fullRoute, typeof document !== "undefined" ? document.title : "");

    // Reset scroll depth tracking on route change
    trackedScrollDepths.current.clear();
  }, [location.pathname, location.href]);

  // 3. Scroll Depth Tracking (25%, 50%, 75%, 100%)
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) return;

      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      const thresholds = [25, 50, 75, 100];

      for (const threshold of thresholds) {
        if (scrollPercent >= threshold && !trackedScrollDepths.current.has(threshold)) {
          trackedScrollDepths.current.add(threshold);
          trackEvent("scroll_depth", {
            depth_percent: threshold,
            page_path: window.location.pathname,
          });
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  // 4. Time on Page Heartbeat (10s, 30s, 60s, 180s)
  useEffect(() => {
    const startTime = Date.now();
    const intervals = [10, 30, 60, 180];
    const timers: NodeJS.Timeout[] = [];

    intervals.forEach((seconds) => {
      const timer = setTimeout(() => {
        trackEvent("time_on_page", {
          seconds_on_page: seconds,
          page_path: window.location.pathname,
        });
      }, seconds * 1000);
      timers.push(timer);
    });

    return () => {
      timers.forEach((t) => clearTimeout(t));
      const totalSeconds = Math.floor((Date.now() - startTime) / 1000);
      if (totalSeconds >= 5 && totalSeconds < 10) {
        trackEvent("time_on_page", {
          seconds_on_page: totalSeconds,
          page_path: window.location.pathname,
        });
      }
    };
  }, [location.pathname]);

  // 5. Outbound Link Click Listener
  useEffect(() => {
    const handleOutboundClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target || !target.href) return;

      const href = target.href;
      if (href.startsWith("http") && !href.includes(window.location.hostname)) {
        trackEvent("outbound_link_click", {
          link_url: href,
          page_path: window.location.pathname,
        });
      }
    };

    document.addEventListener("click", handleOutboundClick, { capture: true });
    return () => document.removeEventListener("click", handleOutboundClick, { capture: true });
  }, []);

  return (
    <AnalyticsContext.Provider
      value={{
        trackEvent,
        updateConsent,
        setUserProperties,
        trackException,
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
}
