import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SalesReport {
  total: number;
  count: number;
  items: { name: string; qty: number; revenue: number }[];
}

function getLocalDayBoundsUTC(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start: start.toISOString(), end: end.toISOString() };
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function useSalesByDate(date: Date) {
  const dateKey = formatDateKey(date);
  return useQuery({
    queryKey: ["reports", dateKey],
    queryFn: async (): Promise<SalesReport> => {
      const { start: startOfDay, end: endOfDay } = getLocalDayBoundsUTC(date);

      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, total")
        .eq("status", "closed")
        .gte("closed_at", startOfDay)
        .lte("closed_at", endOfDay);
      if (error) throw error;

      if (!orders || orders.length === 0) return { total: 0, count: 0, items: [] };

      const orderIds = orders.map((o) => o.id);
      const { data: items } = await supabase
        .from("order_items")
        .select("product_name, price, quantity")
        .in("order_id", orderIds);

      const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();
      for (const i of items || []) {
        const e = itemMap.get(i.product_name) || { name: i.product_name, qty: 0, revenue: 0 };
        e.qty += i.quantity;
        e.revenue += Number(i.price) * i.quantity;
        itemMap.set(i.product_name, e);
      }

      return {
        total: orders.reduce((s, o) => s + Number(o.total), 0),
        count: orders.length,
        items: Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty),
      };
    },
  });
}
