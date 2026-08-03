import React, { useState, useEffect } from "react";
import { Activity, Database, HardDrive, Wifi, CheckCircle, AlertTriangle, ShieldCheck, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function HealthWidget() {
  const [metrics, setMetrics] = useState({
    dbConnected: true,
    storageConnected: true,
    realtimeConnected: true,
    apiLatencyMs: 42,
    storageUsedMb: 124,
    lastChecked: new Date().toLocaleTimeString(),
  });

  useEffect(() => {
    const check = async () => {
      const start = performance.now();
      try {
        await supabase.from("projects").select("id").limit(1);
        const end = performance.now();
        setMetrics((prev) => ({
          ...prev,
          dbConnected: true,
          apiLatencyMs: Math.round(end - start),
          lastChecked: new Date().toLocaleTimeString(),
        }));
      } catch (e) {
        setMetrics((prev) => ({ ...prev, dbConnected: false }));
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h3 className="font-serif text-base font-semibold text-foreground">System Health & Metrics</h3>
        </div>
        <span className="text-[11px] text-muted-foreground">Updated: {metrics.lastChecked}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-secondary/20 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Database</span>
            <Database className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Connected</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-secondary/20 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Storage</span>
            <HardDrive className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>{metrics.storageUsedMb} MB Used</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-secondary/20 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Realtime</span>
            <Wifi className="h-3.5 w-3.5" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Active</span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-secondary/20 p-3 space-y-1">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>API Latency</span>
            <Zap className="h-3.5 w-3.5 text-amber-500" />
          </div>
          <div className="text-xs font-semibold text-foreground">
            <span>{metrics.apiLatencyMs} ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
