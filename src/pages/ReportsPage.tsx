import { useState, useEffect } from "react";
import { getTodaySales, getOrders } from "@/lib/store";
import { DollarSign, ShoppingCart, TrendingUp, Award } from "lucide-react";

export default function ReportsPage() {
  const [sales, setSales] = useState<ReturnType<typeof getTodaySales>>({ total: 0, count: 0, items: [] });

  useEffect(() => { setSales(getTodaySales()); }, []);

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-heading font-bold mb-6">Reporte del Día</h1>
      <p className="text-muted-foreground text-sm mb-6">{new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

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
        <p className="text-muted-foreground text-sm text-center py-8">No hay ventas registradas hoy.</p>
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
