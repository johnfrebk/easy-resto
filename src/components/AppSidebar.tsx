import { NavLink, useLocation } from "react-router-dom";
import { LayoutGrid, UtensilsCrossed, Package, BarChart3, AlertTriangle } from "lucide-react";
import { getLowStockProducts } from "@/lib/store";
import { useState, useEffect } from "react";

const links = [
  { to: "/", icon: LayoutGrid, label: "Mesas" },
  { to: "/menu", icon: UtensilsCrossed, label: "Menú" },
  { to: "/inventario", icon: Package, label: "Inventario" },
  { to: "/reportes", icon: BarChart3, label: "Reportes" },
];

export default function AppSidebar() {
  const location = useLocation();
  const [lowStock, setLowStock] = useState(0);

  useEffect(() => {
    setLowStock(getLowStockProducts().length);
    const interval = setInterval(() => setLowStock(getLowStockProducts().length), 5000);
    return () => clearInterval(interval);
  }, [location]);

  return (
    <aside className="w-20 lg:w-56 bg-sidebar text-sidebar-foreground flex flex-col items-center lg:items-stretch shrink-0 py-6 gap-1">
      <div className="flex items-center gap-2 px-4 mb-8">
        <UtensilsCrossed className="w-7 h-7 text-sidebar-primary" />
        <span className="hidden lg:block font-heading text-lg font-bold text-sidebar-primary">RestoPOS</span>
      </div>

      {links.map(({ to, icon: Icon, label }) => {
        const active = location.pathname === to;
        return (
          <NavLink
            key={to}
            to={to}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg mx-2 transition-colors ${
              active
                ? "bg-sidebar-accent text-sidebar-primary"
                : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {label === "Inventario" && lowStock > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">
                  {lowStock}
                </span>
              )}
            </div>
            <span className="hidden lg:block text-sm font-medium">{label}</span>
          </NavLink>
        );
      })}

      {lowStock > 0 && (
        <div className="mt-auto mx-3 p-3 rounded-lg bg-warning/10 border border-warning/20 hidden lg:flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-sidebar-foreground/80">
            {lowStock} producto{lowStock > 1 ? 's' : ''} con stock bajo
          </p>
        </div>
      )}
    </aside>
  );
}
