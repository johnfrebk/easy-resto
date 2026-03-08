/**
 * Offline Sync Queue
 * Stores pending mutations in localStorage and syncs when back online.
 */
import { supabase } from "@/integrations/supabase/client";

const QUEUE_KEY = "pos_offline_queue";
const CACHE_PREFIX = "pos_cache_";

export type QueueAction =
  | { type: "create_order"; payload: { id: string; table_id: string; table_number: number; created_by: string | null; created_at: string } }
  | { type: "add_item"; payload: { order_id: string; product_id: string; product_name: string; price: number; quantity: number } }
  | { type: "update_item_qty"; payload: { item_id: string; quantity: number; order_id: string } }
  | { type: "remove_item"; payload: { item_id: string; order_id: string } }
  | { type: "close_order"; payload: { order_id: string; user_id: string | null } };

interface QueueEntry {
  id: string;
  action: QueueAction;
  timestamp: number;
}

// ---- Queue Management ----

export function getQueue(): QueueEntry[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueEntry[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue(action: QueueAction) {
  const queue = getQueue();
  queue.push({ id: crypto.randomUUID(), action, timestamp: Date.now() });
  saveQueue(queue);
}

function dequeue(id: string) {
  saveQueue(getQueue().filter((e) => e.id !== id));
}

export function getQueueLength(): number {
  return getQueue().length;
}

// ---- Cache Management ----

export function cacheData<T>(key: string, data: T) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, cachedAt: Date.now() }));
  } catch {
    // storage full — ignore
  }
}

export function getCachedData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw).data as T;
  } catch {
    return null;
  }
}

// ---- Sync Engine ----

const TAX_RATE = 0.16;

async function processAction(action: QueueAction): Promise<boolean> {
  try {
    switch (action.type) {
      case "create_order": {
        const p = action.payload;
        const { error } = await supabase.from("orders").insert({
          id: p.id,
          table_id: p.table_id,
          table_number: p.table_number,
          created_by: p.created_by,
          created_at: p.created_at,
        });
        // Duplicate key means it was already synced
        if (error && !error.message.includes("duplicate")) throw error;
        return true;
      }
      case "add_item": {
        const p = action.payload;
        const { data: existing } = await supabase
          .from("order_items")
          .select("*")
          .eq("order_id", p.order_id)
          .eq("product_id", p.product_id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("order_items")
            .update({ quantity: existing.quantity + p.quantity })
            .eq("id", existing.id);
        } else {
          await supabase.from("order_items").insert({
            order_id: p.order_id,
            product_id: p.product_id,
            product_name: p.product_name,
            price: p.price,
            quantity: p.quantity,
          });
        }
        await recalcOrderRemote(p.order_id);
        return true;
      }
      case "update_item_qty": {
        const p = action.payload;
        await supabase.from("order_items").update({ quantity: Math.max(1, p.quantity) }).eq("id", p.item_id);
        await recalcOrderRemote(p.order_id);
        return true;
      }
      case "remove_item": {
        const p = action.payload;
        await supabase.from("order_items").delete().eq("id", p.item_id);
        await recalcOrderRemote(p.order_id);
        return true;
      }
      case "close_order": {
        const p = action.payload;
        const { data: items } = await supabase.from("order_items").select("*").eq("order_id", p.order_id);
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
                performed_by: p.user_id,
              });
            }
          }
        }
        const { error } = await supabase
          .from("orders")
          .update({ status: "closed", closed_at: new Date().toISOString(), closed_by: p.user_id })
          .eq("id", p.order_id);
        if (error) throw error;
        return true;
      }
    }
  } catch (err) {
    console.error("[OfflineSync] Failed to process action:", action.type, err);
    return false;
  }
}

async function recalcOrderRemote(orderId: string) {
  const { data: items } = await supabase.from("order_items").select("*").eq("order_id", orderId);
  const subtotal = (items || []).reduce((s, i) => s + Number(i.price) * i.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;
  await supabase.from("orders").update({ subtotal, tax, total }).eq("id", orderId);
}

let syncing = false;

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  if (syncing) return { synced: 0, failed: 0 };
  syncing = true;
  let synced = 0;
  let failed = 0;

  try {
    const queue = getQueue();
    for (const entry of queue) {
      const ok = await processAction(entry.action);
      if (ok) {
        dequeue(entry.id);
        synced++;
      } else {
        failed++;
        break; // stop on first failure to maintain order
      }
    }
  } finally {
    syncing = false;
  }

  return { synced, failed };
}
