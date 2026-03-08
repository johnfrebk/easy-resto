import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useRealtimeSync() {
  const qc = useQueryClient();
  const { sessionReady, user } = useAuth();

  useEffect(() => {
    if (!sessionReady || !user) return;

    const channel = supabase
      .channel("pos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        qc.invalidateQueries({ queryKey: ["orders"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, () => {
        qc.invalidateQueries({ queryKey: ["orders"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        qc.invalidateQueries({ queryKey: ["products"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "tables" }, () => {
        qc.invalidateQueries({ queryKey: ["tables"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc, sessionReady, user]);
}
