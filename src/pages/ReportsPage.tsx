import { useState, useRef } from "react";
import { fmtCOP } from "@/lib/currency";
import { useSalesByDate } from "@/hooks/useReports";
import { DollarSign, ShoppingCart, TrendingUp, Award, CalendarIcon, Printer, Download } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function ReportsPage() {
  const [date, setDate] = useState<Date>(new Date());
  const { data: sales = { total: 0, count: 0, items: [] } } = useSalesByDate(date);
  const printRef = useRef<HTMLDivElement>(null);

  const fmt = fmtCOP;
  const isToday = date.toDateString() === new Date().toDateString();
  const dateLabel = format(date, "EEEE d 'de' MMMM 'de' yyyy", { locale: es });

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Reporte de Ventas – ${format(date, "dd/MM/yyyy")}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; padding: 32px; color: #1a1a1a; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          p.subtitle { color: #666; font-size: 13px; margin-bottom: 24px; text-transform: capitalize; }
          .stats { display: flex; gap: 16px; margin-bottom: 28px; }
          .stat { flex: 1; border: 1px solid #e5e5e5; border-radius: 8px; padding: 14px; }
          .stat-label { font-size: 12px; color: #888; margin-bottom: 6px; }
          .stat-value { font-size: 22px; font-weight: 700; }
          h2 { font-size: 16px; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { text-align: left; padding: 8px 10px; border-bottom: 2px solid #e5e5e5; color: #555; font-weight: 600; }
          th:last-child, td:last-child { text-align: right; }
          th:nth-child(3), td:nth-child(3) { text-align: right; }
          td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; }
          td:first-child { font-weight: 700; color: #e07820; }
          .footer { margin-top: 32px; font-size: 11px; color: #aaa; text-align: center; }
        </style>
      </head>
      <body>
        <h1>${isToday ? "Reporte del Día" : "Reporte de Ventas"}</h1>
        <p class="subtitle">${dateLabel}</p>
        <div class="stats">
          <div class="stat">
            <div class="stat-label">Ventas Totales</div>
            <div class="stat-value">${fmt(sales.total)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Órdenes</div>
            <div class="stat-value">${sales.count}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Ticket Promedio</div>
            <div class="stat-value">${sales.count > 0 ? fmt(sales.total / sales.count) : "$0"}</div>
          </div>
        </div>
        <h2>Productos Más Vendidos</h2>
        ${sales.items.length === 0
          ? `<p style="color:#888;text-align:center;padding:24px 0">No hay ventas registradas.</p>`
          : `<table>
              <thead><tr>
                <th>#</th><th>Producto</th><th>Cantidad</th><th>Ingresos</th>
              </tr></thead>
              <tbody>
                ${sales.items.map((item, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${item.name}</td>
                    <td style="text-align:right">${item.qty}</td>
                    <td style="text-align:right">${fmt(item.revenue)}</td>
                  </tr>`).join("")}
              </tbody>
            </table>`
        }
        <div class="footer">Generado por Abby RestoPOS – ${new Date().toLocaleString("es-MX")}</div>
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleExportCSV = () => {
    const rows = [
      ["Reporte de Ventas", format(date, "dd/MM/yyyy")],
      [],
      ["Ventas Totales", fmt(sales.total)],
      ["Órdenes", sales.count],
      ["Ticket Promedio", sales.count > 0 ? fmt(sales.total / sales.count) : "$0.00"],
      [],
      ["#", "Producto", "Cantidad", "Ingresos"],
      ...sales.items.map((item, i) => [i + 1, item.name, item.qty, fmt(item.revenue)]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-${format(date, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in" ref={printRef}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold">
            {isToday ? "Reporte del Día" : "Reporte"}
          </h1>
          <p className="text-muted-foreground text-sm capitalize">{dateLabel}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal gap-2", !date && "text-muted-foreground")}>
                <CalendarIcon className="h-4 w-4" />
                {format(date, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                disabled={(d) => d > new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          {!isToday && (
            <Button variant="ghost" size="sm" onClick={() => setDate(new Date())}>
              Hoy
            </Button>
          )}
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
            <Printer className="w-4 h-4" /> Imprimir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><DollarSign className="w-5 h-5 text-primary" /></div>
            <span className="text-sm text-muted-foreground">Ventas Totales</span>
          </div>
          <p className="text-2xl font-heading font-bold">{fmt(sales.total)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-success/10 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-success" /></div>
            <span className="text-sm text-muted-foreground">Órdenes</span>
          </div>
          <p className="text-2xl font-heading font-bold">{sales.count}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-9 h-9 rounded-lg bg-warning/10 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-warning" /></div>
            <span className="text-sm text-muted-foreground">Ticket Promedio</span>
          </div>
          <p className="text-2xl font-heading font-bold">{sales.count > 0 ? fmt(sales.total / sales.count) : '$0.00'}</p>
        </div>
      </div>

      <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" /> Productos Más Vendidos
      </h2>

      {sales.items.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          No hay ventas registradas {isToday ? "hoy" : "en esta fecha"}.
        </p>
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/50">
              <th className="text-left p-3 font-medium">#</th>
              <th className="text-left p-3 font-medium">Producto</th>
              <th className="text-right p-3 font-medium">Cantidad</th>
              <th className="text-right p-3 font-medium">Ingresos</th>
            </tr></thead>
            <tbody>
              {sales.items.map((item, i) => (
                <tr key={item.name} className="border-b border-border/50">
                  <td className="p-3 font-bold text-primary">{i + 1}</td>
                  <td className="p-3 font-medium">{item.name}</td>
                  <td className="p-3 text-right">{item.qty}</td>
                  <td className="p-3 text-right font-semibold">{fmt(item.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
