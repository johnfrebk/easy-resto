import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type BusinessType = "restaurante" | "cafeteria" | "bar" | "comidas_rapidas";

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  restaurante: "Restaurante",
  cafeteria: "Cafetería",
  bar: "Bar",
  comidas_rapidas: "Comidas rápidas",
};

export const INVOICE_FIELD_LABELS: Record<string, string> = {
  business_name: "Nombre del negocio",
  nit_rut: "NIT / RUT",
  address: "Dirección",
  city: "Ciudad",
  phone: "Teléfono",
  email: "Email",
  opening_hours: "Horario",
  business_type: "Tipo de negocio",
  invoice_message: "Mensaje en factura",
  social_media: "Redes sociales",
  website: "Página web",
};

export interface BusinessConfig {
  iva_enabled: boolean;
  iva_rate: number;
  iva_included_in_price: boolean;
  business_name: string;
  nit_rut: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  opening_hours: string;
  closing_hours: string;
  business_type: BusinessType;
  invoice_message: string;
  social_media: string;
  website: string;
  invoice_fields: string[];
}

const DEFAULTS: BusinessConfig = {
  iva_enabled: true,
  iva_rate: 19,
  iva_included_in_price: false,
  business_name: "Abby RestoPOS",
  nit_rut: "",
  address: "",
  city: "",
  phone: "",
  email: "",
  opening_hours: "",
  closing_hours: "",
  business_type: "restaurante",
  invoice_message: "",
  social_media: "",
  website: "",
  invoice_fields: ["business_name"],
};

function parseConfig(rows: { key: string; value: string }[]): BusinessConfig {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  let invoiceFields: string[] = ["business_name"];
  try {
    const parsed = JSON.parse(map.get("invoice_fields") || "[]");
    if (Array.isArray(parsed)) invoiceFields = parsed;
    if (!invoiceFields.includes("business_name")) invoiceFields.unshift("business_name");
  } catch {}

  return {
    iva_enabled: map.get("iva_enabled") === "true",
    iva_rate: Number(map.get("iva_rate") ?? 19),
    iva_included_in_price: map.get("iva_included_in_price") === "true",
    business_name: map.get("business_name") ?? DEFAULTS.business_name,
    nit_rut: map.get("nit_rut") ?? "",
    address: map.get("address") ?? "",
    city: map.get("city") ?? "",
    phone: map.get("phone") ?? "",
    email: map.get("email") ?? "",
    opening_hours: map.get("opening_hours") ?? "",
    closing_hours: map.get("closing_hours") ?? "",
    business_type: (map.get("business_type") as BusinessType) ?? "restaurante",
    invoice_message: map.get("invoice_message") ?? "",
    social_media: map.get("social_media") ?? "",
    website: map.get("website") ?? "",
    invoice_fields: invoiceFields,
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
        value: typeof value === "object" ? JSON.stringify(value) : String(value),
      }));
      for (const entry of entries) {
        // Try update first, if no rows affected, insert
        const { data } = await supabase
          .from("business_config")
          .update({ value: entry.value })
          .eq("key", entry.key)
          .select();
        if (!data || data.length === 0) {
          await supabase
            .from("business_config")
            .insert({ key: entry.key, value: entry.value });
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["business_config"] }),
  });
}

export { DEFAULTS as BUSINESS_CONFIG_DEFAULTS };
