import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fmtCOP } from "@/lib/currency";
import { useBusinessConfig, BUSINESS_TYPE_LABELS } from "@/hooks/useBusinessConfig";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon, Printer, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ClosedOrder {
  id: string;
  table_number: number;
  subtotal: number;
  tax: number;
  total: number;
  closed_at: string;
  items: { id: string; product_name: string; price: number; quantity: number }[];
}

function useClosedOrders(from: Date, to: Date) {
  const fromKey = format(from, "yyyy-MM-dd");
  const toKey = format(to, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["closed-orders", fromKey, toKey],
    queryFn: async (): Promise<ClosedOrder[]> => {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);

      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, table_number, subtotal, tax, total, closed_at")
        .eq("status", "closed")
        .gte("closed_at", start.toISOString())
        .lte("closed_at", end.toISOString())
        .order("closed_at", { ascending: false });

      if (error) throw error;
      if (!orders || orders.length === 0) return [];

      const orderIds = orders.map((o) => o.id);
      const { data: items } = await supabase
        .from("order_items")
        .select("id, order_id, product_name, price, quantity")
        .in("order_id", orderIds);

      return orders.map((o) => ({
        ...o,
        closed_at: o.closed_at!,
        items: (items || []).filter((i) => i.order_id === o.id),
      }));
    },
  });
}

export default function DocumentReprintPage() {
  const today = new Date();
  const [dateFrom, setDateFrom] = useState<Date>(today);
  const [dateTo, setDateTo] = useState<Date>(today);
  const [selectedOrder, setSelectedOrder] = useState<ClosedOrder | null>(null);
  const { data: orders = [], isLoading } = useClosedOrders(dateFrom, dateTo);
  const { data: businessConfig } = useBusinessConfig();

  const handlePrint = (order: ClosedOrder) => {
    const cfg = businessConfig;
    const fields = cfg?.invoice_fields || [];
    const win = window.open("", "_blank", "width=400,height=600");
    if (!win) return;

    const headerParts: string[] = [];
    headerParts.push(`<p style="font-weight:bold;font-size:16px;margin:0">${cfg?.business_name || "Mi Negocio"}</p>`);
    if (fields.includes("business_type") && cfg?.business_type)
      headerParts.push(`<p style="font-size:11px;color:#666;margin:2px 0">${BUSINESS_TYPE_LABELS[cfg.business_type]}</p>`);
    if (fields.includes("nit_rut") && cfg?.nit_rut)
      headerParts.push(`<p style="font-size:11px;margin:1px 0">NIT: ${cfg.nit_rut}</p>`);
    if (fields.includes("address") && cfg?.address)
      headerParts.push(`<p style="font-size:11px;margin:1px 0">${cfg.address}</p>`);
    if (fields.includes("city") && cfg?.city)
      headerParts.push(`<p style="font-size:11px;margin:1px 0">${cfg.city}</p>`);
    if (fields.includes("phone") && cfg?.phone)
      headerParts.push(`<p style="font-size:11px;margin:1px 0">Tel: ${cfg.phone}</p>`);
    if (fields.includes("email") && cfg?.email)
      headerParts.push(`<p style="font-size:11px;margin:1px 0">${cfg.email}</p>`);

    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Factura</title>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:monospace;padding:20px;font-size:13px;max-width:300px;margin:0 auto}
      .center{text-align:center}.dash{border-top:1px dashed #ccc;margin:8px 0}.row{display:flex;justify-content:space-between}.bold{font-weight:bold}.total{font-size:15px}</style>
      </head><body>
      <div class="center">${headerParts.join("")}</div>
      <p class="center" style="font-size:11px;color:#888;margin-top:6px">${new Date(order.closed_at).toLocaleString("es-CO")}</p>
      <p class="center" style="font-size:11px;color:#888">Mesa ${order.table_number}</p>
      <p class="center" style="font-size:10px;color:#aaa;margin-top:2px">REIMPRESIÓN</p>
      <div class="dash"></div>
      ${order.items.map((i) => `<div class="row"><span>${i.quantity}x ${i.product_name}</span><span>${fmtCOP(Number(i.price) * i.quantity)}</span></div>`).join("")}
      <div class="dash"></div>
      <div class="row"><span>Subtotal</span><span>${fmtCOP(order.subtotal)}</span></div>
      <div class="row"><span>IVA</span><span>${fmtCOP(order.tax)}</span></div>
      <div class="row bold total"><span>TOTAL</span><span>${fmtCOP(order.total)}</span></div>
      ${fields.includes("invoice_message") && cfg?.invoice_message ? `<p class="center" style="font-size:10px;color:#888;margin-top:10px;font-style:italic">${cfg.invoice_message}</p>` : ""}
      <div class="dash"></div>
      <p class="center" style="font-size:10px;color:#aaa">Generado por Abby RestoPOS</p>
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const isToday = dateFrom.toDateString() === today.toDateString() && dateTo.toDateString() === today.toDateString();

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">Reimpresión de Documentos</h1>
          <p className="text-muted-foreground text-sm">
            {isToday
              ? "Documentos del día"
              : `${format(dateFrom, "dd/MM/yyyy")} — ${format(dateTo, "dd/MM/yyyy")}`}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(dateFrom, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(d) => {
                  if (d) {
                    setDateFrom(d);
                    if (d > dateTo) setDateTo(d);
                  }
                }}
                disabled={(d) => d > new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-sm">a</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(dateTo, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(d) => {
                  if (d) {
                    setDateTo(d);
                    if (d < dateFrom) setDateFrom(d);
                  }
                }}
                disabled={(d) => d > new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {!isToday && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFrom(today); setDateTo(today); }}>
              Hoy
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No hay documentos en este rango de fechas.</p>
        </div>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="text-left p-3 font-medium">#</th>
                <th className="text-left p-3 font-medium">Fecha / Hora</th>
                <th className="text-left p-3 font-medium">Mesa</th>
                <th className="text-right p-3 font-medium">Items</th>
                <th className="text-right p-3 font-medium">Total</th>
                <th className="text-center p-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={order.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="p-3 font-bold text-primary">{i + 1}</td>
                  <td className="p-3 text-muted-foreground">
                    {format(new Date(order.closed_at), "dd/MM/yyyy HH:mm", { locale: es })}
                  </td>
                  <td className="p-3 font-medium">Mesa {order.table_number}</td>
                  <td className="p-3 text-right">{order.items.length}</td>
                  <td className="p-3 text-right font-semibold">{fmtCOP(order.total)}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedOrder(order)}
                        className="gap-1"
                      >
                        <Search className="w-3.5 h-3.5" /> Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrint(order)}
                        className="gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" /> Reimprimir
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(v) => !v && setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Factura - Mesa {selectedOrder?.table_number}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-3">
              <div className="border rounded-lg p-4 space-y-2 text-sm font-mono">
                {businessConfig && <InvoiceHeaderPreview config={businessConfig} />}
                <p className="text-center text-muted-foreground text-xs">
                  {new Date(selectedOrder.closed_at).toLocaleString("es-CO")}
                </p>
                <p className="text-center text-muted-foreground text-xs">Mesa {selectedOrder.table_number}</p>
                <p className="text-center text-xs text-warning font-semibold">REIMPRESIÓN</p>
                <div className="border-t border-dashed my-2" />
                {selectedOrder.items.map((i) => (
                  <div key={i.id} className="flex justify-between">
                    <span>{i.quantity}x {i.product_name}</span>
                    <span>{fmtCOP(Number(i.price) * i.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-dashed my-2" />
                <div className="flex justify-between"><span>Subtotal</span><span>{fmtCOP(selectedOrder.subtotal)}</span></div>
                <div className="flex justify-between"><span>IVA</span><span>{fmtCOP(selectedOrder.tax)}</span></div>
                <div className="flex justify-between font-bold text-base"><span>TOTAL</span><span>{fmtCOP(selectedOrder.total)}</span></div>
                {businessConfig?.invoice_fields.includes("invoice_message") && businessConfig.invoice_message && (
                  <p className="text-center text-xs text-muted-foreground mt-2 italic">{businessConfig.invoice_message}</p>
                )}
              </div>
              <Button className="w-full gap-2" onClick={() => handlePrint(selectedOrder)}>
                <Printer className="w-4 h-4" /> Reimprimir
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InvoiceHeaderPreview({ config }: { config: import("@/hooks/useBusinessConfig").BusinessConfig }) {
  const fields = config.invoice_fields;
  return (
    <div className="text-center space-y-0.5 mb-2">
      <p className="font-bold text-base">{config.business_name}</p>
      {fields.includes("business_type") && config.business_type && (
        <p className="text-xs text-muted-foreground">{BUSINESS_TYPE_LABELS[config.business_type]}</p>
      )}
      {fields.includes("nit_rut") && config.nit_rut && <p className="text-xs">NIT: {config.nit_rut}</p>}
      {fields.includes("address") && config.address && <p className="text-xs">{config.address}</p>}
      {fields.includes("city") && config.city && <p className="text-xs">{config.city}</p>}
      {fields.includes("phone") && config.phone && <p className="text-xs">Tel: {config.phone}</p>}
      {fields.includes("email") && config.email && <p className="text-xs">{config.email}</p>}
    </div>
  );
}
