import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRealtimeSync(table: string, onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel(`realtime_${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        (payload) => {
          toast.info(`${table.slice(0, -1)} data updated by another session.`);
          onUpdate();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onUpdate]);
}
