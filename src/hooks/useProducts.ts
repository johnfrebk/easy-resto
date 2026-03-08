import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cacheData, getCachedData } from "@/lib/offlineQueue";

export const CATEGORIES = ["Comida", "Bebidas", "Postres", "Extras"];

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  active: boolean;
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("active", true)
          .order("name");
        if (error) throw error;
        const products = data as Product[];
        cacheData("products", products);
        return products;
      } catch (err) {
        if (!navigator.onLine) {
          const cached = getCachedData<Product[]>("products");
          if (cached) return cached;
        }
        throw err;
      }
    },
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ["products", "lowStock"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("products").select("*").eq("active", true);
        if (error) throw error;
        return (data as Product[]).filter((p) => p.stock <= p.min_stock);
      } catch (err) {
        if (!navigator.onLine) {
          const cached = getCachedData<Product[]>("products");
          if (cached) return cached.filter((p) => p.stock <= p.min_stock);
        }
        throw err;
      }
    },
  });
}

export function useAddProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Omit<Product, "id" | "active">) => {
      const { error } = await supabase.from("products").insert(p);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { error } = await supabase.from("products").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").update({ active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}
