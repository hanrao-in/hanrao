export interface PerformanceEntry {
  category: "Validation" | "Storage" | "Database" | "Network" | "Rendering" | "Cache";
  operation: string;
  durationMs: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

class PerformanceLogger {
  private logs: PerformanceEntry[] = [];
  private isDev = process.env.NODE_ENV !== "production";

  startTimer(operation: string, category: PerformanceEntry["category"]) {
    const start = performance.now();
    return (metadata?: Record<string, any>) => {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      const entry: PerformanceEntry = {
        category,
        operation,
        durationMs,
        timestamp: new Date().toISOString(),
        metadata,
      };
      this.logs.push(entry);
      if (this.isDev) {
        const color = durationMs > 500 ? "color: red; font-weight: bold;" : "color: green;";
        console.log(
          `%c[PERF] ${category} -> ${operation}: ${durationMs}ms`,
          color,
          metadata || ""
        );
      }
      return durationMs;
    };
  }

  getLogs() {
    return this.logs;
  }

  getSummary() {
    const totalCount = this.logs.length;
    const slowQueries = this.logs.filter((l) => l.durationMs > 500);
    const avgDuration =
      totalCount > 0
        ? Math.round(this.logs.reduce((acc, curr) => acc + curr.durationMs, 0) / totalCount)
        : 0;

    return {
      totalOps: totalCount,
      avgDurationMs: avgDuration,
      slowOpsCount: slowQueries.length,
      slowOps: slowQueries,
    };
  }

  clear() {
    this.logs = [];
  }
}

export const perfLogger = new PerformanceLogger();
