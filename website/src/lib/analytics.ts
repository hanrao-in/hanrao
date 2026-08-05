/**
 * Google Analytics 4 (GA4) SPA Production Analytics Module
 * Includes Consent Mode v2, Event Queueing, PII Protection, Web Vitals, and SPA Route Tracking.
 */

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
  }
}

export interface ConsentState {
  analytics_storage: "granted" | "denied";
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
}

export type CustomEventName =
  | "project_view"
  | "brochure_download"
  | "video_play"
  | "gallery_image_view"
  | "gallery_video_play"
  | "site_visit_submit"
  | "contact_submit"
  | "phone_click"
  | "whatsapp_click"
  | "map_click"
  | "search"
  | "filter_applied"
  | "scroll_depth"
  | "time_on_page"
  | "outbound_link_click"
  | "404_page_view"
  | "pdf_preview"
  | "cta_click"
  | "gallery_swipe"
  | "hero_banner_click"
  | "project_compare"
  | "call_back_request"
  | "web_vitals"
  | "exception";

export interface EventParams {
  project_name?: string;
  project_id?: string;
  project_location?: string;
  project_type?: string;
  visitor_type?: string;
  lead_source?: string;
  page_category?: string;
  search_term?: string;
  filter_type?: string;
  filter_value?: string;
  image_index?: number;
  video_index?: number;
  video_type?: string;
  location?: string;
  form_type?: string;
  depth_percent?: number;
  seconds_on_page?: number;
  link_url?: string;
  button_name?: string;
  metric_name?: string;
  metric_value?: number;
  page_path?: string;
  message?: string;
  filename?: string;
  line?: number;
  column?: number;
  fatal?: boolean;
  [key: string]: any;
}

const DEFAULT_CONSENT: ConsentState = {
  analytics_storage: "granted",
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
};

const CONSENT_STORAGE_KEY = "hanrao_ga_consent";
const MAX_QUEUE_SIZE = 100;

let isInitialized = false;
let isScriptLoaded = false;
let isLocalhost = false;
let lastTrackedRoute = "";
const recentEventTimestamps = new Map<string, number>();

interface QueuedItem {
  type: "page_view" | "event" | "consent" | "user_properties";
  payload: any;
}

const eventQueue: QueuedItem[] = [];

/**
 * PII Sanitizer: Strips sensitive user credentials, names, emails, phone numbers, and auth tokens.
 */
function sanitizeParams(params?: EventParams): EventParams {
  if (!params) return {};
  const sanitized: EventParams = {};
  const piiKeys = [
    "phone",
    "email",
    "name",
    "token",
    "auth",
    "password",
    "jwt",
    "address",
    "payment",
    "card",
    "cvv",
    "ssn",
    "user_id",
    "customer_name",
    "booking_id",
  ];

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /\+?\d{10,14}/;

  for (const [key, value] of Object.entries(params)) {
    const keyLower = key.toLowerCase();
    if (piiKeys.some((k) => keyLower.includes(k))) {
      continue; // Omit PII key
    }

    if (typeof value === "string") {
      if (emailRegex.test(value) || phoneRegex.test(value)) {
        continue; // Omit PII value string
      }
    }

    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Reads saved consent or returns default consent state.
 */
export function getStoredConsent(): ConsentState {
  if (typeof window === "undefined") return DEFAULT_CONSENT;
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Fall back to default
  }
  return DEFAULT_CONSENT;
}

/**
 * Updates consent state at runtime and persists to localStorage.
 */
export function updateConsent(consent: Partial<ConsentState>): void {
  const current = getStoredConsent();
  const updated: ConsentState = { ...current, ...consent };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
  }

  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("consent", "update", updated);
    if (import.meta.env.DEV) {
      console.log("✓ [GA4] Consent updated:", updated);
    }
  } else {
    queueItem({ type: "consent", payload: updated });
  }
}

function queueItem(item: QueuedItem): void {
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    eventQueue.shift(); // Remove oldest item to maintain bounded FIFO
  }
  eventQueue.push(item);
}

function flushQueue(): void {
  if (typeof window === "undefined" || !window.gtag) return;
  while (eventQueue.length > 0) {
    const item = eventQueue.shift();
    if (!item) break;
    if (item.type === "page_view") {
      trackPageView(item.payload.routePath, item.payload.title);
    } else if (item.type === "event") {
      trackEvent(item.payload.eventName, item.payload.params);
    } else if (item.type === "consent") {
      window.gtag("consent", "update", item.payload);
    } else if (item.type === "user_properties") {
      window.gtag("set", "user_properties", item.payload);
    }
  }
}

/**
 * Initializes Google Analytics 4 strictly once.
 */
export function initializeAnalytics(): void {
  if (typeof window === "undefined" || isInitialized) return;
  isInitialized = true;

  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-WMVEQG20CT";
  const hostname = window.location.hostname;
  isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".local") ||
    hostname === "::1";

  const isDebugMode = import.meta.env.DEV || import.meta.env.VITE_GA_DEBUG === "true";

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  };

  window.gtag("js", new Date());

  // Google Consent Mode v2 Default
  const initialConsent = getStoredConsent();
  window.gtag("consent", "default", initialConsent);

  // Configure GA4 without auto send_page_view (router handles SPA route events)
  window.gtag("config", measurementId, {
    send_page_view: false,
    debug_mode: isDebugMode,
  });

  if (isLocalhost && !import.meta.env.VITE_GA_DEBUG) {
    if (import.meta.env.DEV) {
      console.log(`[GA4 Localhost Mode] Initialized for ${measurementId}. Real network dispatches disabled on localhost.`);
    }
    isScriptLoaded = true;
    flushQueue();
    setupExceptionListeners();
    setupWebVitals();
    return;
  }

  // Inject gtag.js asynchronously
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.onload = () => {
    isScriptLoaded = true;
    if (import.meta.env.DEV) {
      console.log(`✓ [GA4] Loaded script asynchronously (${measurementId})`);
    }
    flushQueue();
  };
  script.onerror = () => {
    if (import.meta.env.DEV) {
      console.warn("⚠️ [GA4] Failed to load gtag.js script");
    }
  };

  document.head.appendChild(script);

  setupExceptionListeners();
  setupWebVitals();
}

/**
 * Tracks SPA Page Views (pathname + search + hash). Deduplicates identical consecutive routes.
 */
export function trackPageView(routePath?: string, title?: string): void {
  if (typeof window === "undefined") return;

  const currentRoute = routePath || `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (currentRoute === lastTrackedRoute) {
    return; // Ignore duplicate consecutive route calls
  }
  lastTrackedRoute = currentRoute;

  const pageTitle = title || document.title || "HanRao Realty";
  const payload = {
    page_location: window.location.href,
    page_path: currentRoute,
    page_title: pageTitle,
  };

  if (!isScriptLoaded && !isLocalhost) {
    queueItem({ type: "page_view", payload: { routePath: currentRoute, title: pageTitle } });
    return;
  }

  if (import.meta.env.DEV) {
    console.log(`✓ [GA4] Page View: ${currentRoute} ("${pageTitle}")`);
  }

  if (!isLocalhost || import.meta.env.VITE_GA_DEBUG) {
    window.gtag?.("event", "page_view", payload);
  }
}

/**
 * Tracks Custom Business & Behavioral Events with debouncing and PII sanitization.
 */
export function trackEvent(eventName: CustomEventName | string, params?: EventParams): void {
  if (typeof window === "undefined") return;

  const cleanParams = sanitizeParams(params);
  const eventKey = `${eventName}:${JSON.stringify(cleanParams)}`;
  const now = Date.now();
  const lastTime = recentEventTimestamps.get(eventKey);

  // Debounce identical events within 100ms
  if (lastTime && now - lastTime < 100) {
    return;
  }
  recentEventTimestamps.set(eventKey, now);

  // Clean up old debounce timestamps
  if (recentEventTimestamps.size > 200) {
    recentEventTimestamps.clear();
  }

  if (!isScriptLoaded && !isLocalhost) {
    queueItem({ type: "event", payload: { eventName, params: cleanParams } });
    return;
  }

  if (import.meta.env.DEV) {
    console.log(`✓ [GA4] Event: ${eventName}`, cleanParams);
  }

  if (!isLocalhost || import.meta.env.VITE_GA_DEBUG) {
    window.gtag?.("event", eventName, cleanParams);
  }
}

/**
 * Sets user properties in GA4.
 */
export function setUserProperties(properties: Record<string, any>): void {
  if (typeof window === "undefined") return;
  const cleanProps = sanitizeParams(properties);

  if (!isScriptLoaded && !isLocalhost) {
    queueItem({ type: "user_properties", payload: cleanProps });
    return;
  }

  window.gtag?.("set", "user_properties", cleanProps);
}

/**
 * Reports exceptions to GA4.
 */
export function trackException(error: Error | string, details?: { fatal?: boolean; filename?: string; line?: number; column?: number }): void {
  const message = typeof error === "string" ? error : error.message || "Unknown Error";
  trackEvent("exception", {
    message,
    fatal: details?.fatal ?? false,
    filename: details?.filename,
    line: details?.line,
    column: details?.column,
  });
}

/**
 * Automated Global Window Error Listeners.
 */
function setupExceptionListeners(): void {
  if (typeof window === "undefined") return;

  window.addEventListener("error", (event) => {
    trackException(event.message || "Uncaught Error", {
      fatal: true,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    const message = reason instanceof Error ? reason.message : String(reason || "Unhandled Rejection");
    trackException(message, { fatal: false });
  });
}

/**
 * Web Vitals reporter using PerformanceObserver API.
 */
function setupWebVitals(): void {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

  try {
    // 1. LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      if (lastEntry) {
        trackEvent("web_vitals", {
          metric_name: "LCP",
          metric_value: Math.round(lastEntry.startTime),
          page_path: window.location.pathname,
        });
      }
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

    // 2. CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
      trackEvent("web_vitals", {
        metric_name: "CLS",
        metric_value: Math.round(clsValue * 1000) / 1000,
        page_path: window.location.pathname,
      });
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });

    // 3. FID / INP (First Input Delay)
    const fidObserver = new PerformanceObserver((entryList) => {
      const firstInput = entryList.getEntries()[0] as any;
      if (firstInput) {
        trackEvent("web_vitals", {
          metric_name: "FID",
          metric_value: Math.round(firstInput.processingStart - firstInput.startTime),
          page_path: window.location.pathname,
        });
      }
    });
    fidObserver.observe({ type: "first-input", buffered: true });
  } catch {
    // Ignore unsupported PerformanceObserver entries
  }
}
