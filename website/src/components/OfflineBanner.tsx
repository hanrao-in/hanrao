import React from "react";
import { WifiOff } from "lucide-react";
import { useOfflineStatus } from "@/hooks/useOfflineStatus";

export function OfflineBanner() {
  const isOffline = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div className="bg-amber-600 text-white px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 shadow-md sticky top-0 z-50 animate-pulse">
      <WifiOff className="h-4 w-4" />
      <span>You are currently offline. Showing cached portal data.</span>
    </div>
  );
}
