import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, Mail } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Uncaught Error Boundary Exception]:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-xl space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-foreground">Something went wrong</h2>
            <p className="text-xs text-muted-foreground">
              An unexpected application error occurred. You can retry the operation, return home, or contact technical support.
            </p>
            {this.state.error && (
              <pre className="text-[10px] text-left p-2 rounded bg-muted overflow-x-auto text-red-500 font-mono">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 min-h-[48px]"
              >
                <RefreshCw className="h-4 w-4" /> Retry
              </button>
              <a
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-secondary min-h-[48px]"
              >
                <Home className="h-4 w-4" /> Go Home
              </a>
              <a
                href="mailto:support@hanrao.in"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold hover:bg-secondary min-h-[48px]"
              >
                <Mail className="h-4 w-4" /> Contact Support
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
