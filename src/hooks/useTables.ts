import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cacheData, getCachedData } from "@/lib/offlineQueue";

export interface RestTable {
  id: string;
  table_number: number;
  active: boolean;
}

export function useTables() {
  const { sessionReady, user } = useAuth();
  return useQuery({
    queryKey: ["tables"],
    enabled: sessionReady && !!user,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("tables")
          .select("*")
          .eq("active", true)
          .order("table_number");
        if (error) throw error;
        const tables = data as RestTable[];
        cacheData("tables", tables);
        return tables;
      } catch (err) {
        if (!navigator.onLine) {
          const cached = getCachedData<RestTable[]>("tables");
          if (cached) return cached;
        }
        throw err;
      }
    },
  });
}

export function useAddTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await supabase
        .from("tables")
        .select("table_number")
        .eq("active", true)
        .order("table_number", { ascending: false })
        .limit(1);
      const next = data && data.length > 0 ? data[0].table_number + 1 : 1;
      const { data: newTable, error } = await supabase
        .from("tables")
        .insert({ table_number: next })
        .select()
        .single();
      if (error) throw error;
      return newTable as RestTable;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}

export function useRemoveTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tables").update({ active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}
