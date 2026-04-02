import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessConfig {
  iva_enabled: boolean;
  iva_rate: number;
  iva_included_in_price: boolean;
  business_name: string;
}

const DEFAULTS: BusinessConfig = {
  iva_enabled: true,
  iva_rate: 19,
  iva_included_in_price: false,
  business_name: "Abby RestoPOS",
};

function parseConfig(rows: { key: string; value: string }[]): BusinessConfig {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    iva_enabled: map.get("iva_enabled") === "true",
    iva_rate: Number(map.get("iva_rate") ?? 19),
    iva_included_in_price: map.get("iva_included_in_price") === "true",
    business_name: map.get("business_name") ?? "Abby RestoPOS",
  };
}

export function useBusinessConfig() {
  return useQuery({
    queryKey: ["business_config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_config")
        .select("key, value");
      if (error) throw error;
      return parseConfig(data || []);
    },
  });
}

export function useUpdateBusinessConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<BusinessConfig>) => {
      const entries = Object.entries(updates).map(([key, value]) => ({
        key,
        value: String(value),
      }));
      for (const entry of entries) {
        const { error } = await supabase
          .from("business_config")
          .update({ value: entry.value })
          .eq("key", entry.key);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business_config"] }),
  });
}

export { DEFAULTS as BUSINESS_CONFIG_DEFAULTS };
