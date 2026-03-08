import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { enqueue, cacheData, getCachedData } from "@/lib/offlineQueue";

const TAX_RATE = 0.16;

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  table_id: string;
  table_number: number;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  created_at: string;
  closed_at: string | null;
  created_by: string | null;
  closed_by: string | null;
  items: OrderItem[];
}

export function useOpenOrders() {
  const { sessionReady, user } = useAuth();
  return useQuery({
    queryKey: ["orders", "open"],
    enabled: sessionReady && !!user,
    queryFn: async () => {
      try {
        const { data: orders, error } = await supabase
          .from("orders")
          .select("*")
          .eq("status", "open");
        if (error) throw error;

        const orderIds = orders.map((o: any) => o.id);
        let items: any[] = [];
        if (orderIds.length > 0) {
          const { data, error: itemsErr } = await supabase
            .from("order_items")
            .select("*")
            .in("order_id", orderIds);
          if (itemsErr) throw itemsErr;
          items = data || [];
        }

        const result = orders.map((o: any) => ({
          ...o,
          items: items.filter((i: any) => i.order_id === o.id),
        })) as Order[];

        // Cache for offline use
        cacheData("orders_open", result);
        return result;
      } catch (err) {
        // If offline, return cached data
        if (!navigator.onLine) {
          const cached = getCachedData<Order[]>("orders_open");
          if (cached) return cached;
        }
        throw err;
      }
    },
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tableId, tableNumber, userId }: { tableId: string; tableNumber: number; userId?: string }) => {
      if (!navigator.onLine) {
        // Create locally and queue for sync
        const offlineOrder: Order = {
          id: crypto.randomUUID(),
          table_id: tableId,
          table_number: tableNumber,
          status: "open",
          subtotal: 0,
          tax: 0,
          total: 0,
          created_at: new Date().toISOString(),
          closed_at: null,
          created_by: userId || null,
          closed_by: null,
          items: [],
        };
        enqueue({
          type: "create_order",
          payload: {
            id: offlineOrder.id,
            table_id: tableId,
            table_number: tableNumber,
            created_by: userId || null,
            created_at: offlineOrder.created_at,
          },
        });
        // Update local cache
        const cached = getCachedData<Order[]>("orders_open") || [];
        cached.push(offlineOrder);
        cacheData("orders_open", cached);
        return offlineOrder;
      }

      const { data, error } = await supabase
        .from("orders")
        .insert({ table_id: tableId, table_number: tableNumber, created_by: userId || null })
        .select()
        .single();
      if (error) throw error;
      return { ...data, items: [] } as Order;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useAddItemToOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, productId, productName, price, quantity }: {
      orderId: string; productId: string; productName: string; price: number; quantity: number;
    }) => {
      if (!navigator.onLine) {
        enqueue({
          type: "add_item",
          payload: { order_id: orderId, product_id: productId, product_name: productName, price, quantity },
        });
        // Update local cache
        const cached = getCachedData<Order[]>("orders_open") || [];
        const order = cached.find((o) => o.id === orderId);
        if (order) {
          const existing = order.items.find((i) => i.product_id === productId);
          if (existing) {
            existing.quantity += quantity;
          } else {
            order.items.push({
              id: crypto.randomUUID(),
              order_id: orderId,
              product_id: productId,
              product_name: productName,
              price,
              quantity,
            });
          }
          order.subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
          order.tax = order.subtotal * TAX_RATE;
          order.total = order.subtotal + order.tax;
          cacheData("orders_open", cached);
        }
        return;
      }

      // Online path
      const { data: existing } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .eq("product_id", productId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("order_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
      } else {
        await supabase.from("order_items").insert({
          order_id: orderId,
          product_id: productId,
          product_name: productName,
          price,
          quantity,
        });
      }

      await recalcOrder(orderId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useUpdateItemQty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, quantity, orderId }: { itemId: string; quantity: number; orderId: string }) => {
      if (!navigator.onLine) {
        enqueue({ type: "update_item_qty", payload: { item_id: itemId, quantity, order_id: orderId } });
        const cached = getCachedData<Order[]>("orders_open") || [];
        const order = cached.find((o) => o.id === orderId);
        if (order) {
          const item = order.items.find((i) => i.id === itemId);
          if (item) item.quantity = Math.max(1, quantity);
          order.subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
          order.tax = order.subtotal * TAX_RATE;
          order.total = order.subtotal + order.tax;
          cacheData("orders_open", cached);
        }
        return;
      }
      await supabase.from("order_items").update({ quantity: Math.max(1, quantity) }).eq("id", itemId);
      await recalcOrder(orderId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useRemoveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, orderId }: { itemId: string; orderId: string }) => {
      if (!navigator.onLine) {
        enqueue({ type: "remove_item", payload: { item_id: itemId, order_id: orderId } });
        const cached = getCachedData<Order[]>("orders_open") || [];
        const order = cached.find((o) => o.id === orderId);
        if (order) {
          order.items = order.items.filter((i) => i.id !== itemId);
          order.subtotal = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
          order.tax = order.subtotal * TAX_RATE;
          order.total = order.subtotal + order.tax;
          cacheData("orders_open", cached);
        }
        return;
      }
      await supabase.from("order_items").delete().eq("id", itemId);
      await recalcOrder(orderId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
}

export function useCloseOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, userId }: { orderId: string; userId?: string }) => {
      if (!navigator.onLine) {
        enqueue({ type: "close_order", payload: { order_id: orderId, user_id: userId || null } });
        const cached = getCachedData<Order[]>("orders_open") || [];
        cacheData("orders_open", cached.filter((o) => o.id !== orderId));
        return;
      }

      const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
      if (items) {
        for (const item of items) {
          const { data: prod } = await supabase.from("products").select("stock, name").eq("id", item.product_id).single();
          if (prod) {
            await supabase.from("products").update({ stock: Math.max(0, prod.stock - item.quantity) }).eq("id", item.product_id);
            await supabase.from("inventory_logs").insert({
              product_id: item.product_id,
              product_name: prod.name,
              type: "venta",
              quantity: item.quantity,
              performed_by: userId || null,
            });
          }
        }
      }

      const { error } = await supabase
        .from("orders")
        .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: userId || null })
        .eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

async function recalcOrder(orderId: string) {
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
  const subtotal = (items || []).reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  await supabase.from("orders").update({ subtotal, tax, total }).eq("id", orderId);
}
