type ErrorOptions = {
  mechanism?: "manual" | "onerror" | "unhandledrejection" | "react_error_boundary";
  handled?: boolean;
  severity?: "error" | "warning" | "info";
};

export function reportError(
  error: unknown,
  context: Record<string, unknown> = {},
  options: ErrorOptions = {},
) {
  const { mechanism = "manual", severity = "error" } = options;

  const source = typeof window !== "undefined" ? window.location.pathname : "server";

  console.error(`[${severity.toUpperCase()}] Error (${mechanism}) at ${source}:`, error, context);
}
