import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InventoryLog {
  id: string;
  product_id: string;
  product_name: string;
  type: string;
  quantity: number;
  created_at: string;
  performed_by: string | null;
}

export function useInventoryLogs() {
  return useQuery({
    queryKey: ["inventory_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as InventoryLog[];
    },
  });
}

export function useAddInventoryEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, type, quantity, userId }: {
      productId: string; type: "entrada" | "salida"; quantity: number; userId?: string;
    }) => {
      const { data: prod } = await supabase.from("products").select("stock, name").eq("id", productId).single();
      if (!prod) throw new Error("Producto no encontrado");

      const newStock = type === "entrada" ? prod.stock + quantity : Math.max(0, prod.stock - quantity);
      await supabase.from("products").update({ stock: newStock }).eq("id", productId);

      await supabase.from("inventory_logs").insert({
        product_id: productId,
        product_name: prod.name,
        type,
        quantity,
        performed_by: userId || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["inventory_logs"] });
    },
  });
}
