import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, UtensilsCrossed, Package, BarChart3, AlertTriangle, LogOut, Users, DatabaseBackup } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLowStockProducts } from "@/hooks/useProducts";
import { useRealtimeSync } from "@/hooks/useRealtime";

const allLinks = [
  { to: "/", icon: LayoutGrid, label: "Mesas", roles: ["admin", "cajero", "mesero"] },
  { to: "/menu", icon: UtensilsCrossed, label: "Menú", roles: ["admin"] },
  { to: "/inventario", icon: Package, label: "Inventario", roles: ["admin"] },
  { to: "/reportes", icon: BarChart3, label: "Reportes", roles: ["admin", "cajero"] },
  { to: "/usuarios", icon: Users, label: "Usuarios", roles: ["admin"] },
  { to: "/backup", icon: DatabaseBackup, label: "Respaldo", roles: ["admin"] },
];

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, displayName, signOut } = useAuth();
  const { data: lowStockProducts } = useLowStockProducts();
  const lowStock = lowStockProducts?.length ?? 0;

  useRealtimeSync();

  const links = allLinks.filter(l => l.roles.includes(role || ""));

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("Logout error:", e);
    }
    navigate("/login", { replace: true });
  };

  return (
    <aside className="w-20 lg:w-56 bg-sidebar text-sidebar-foreground flex flex-col items-center lg:items-stretch shrink-0 py-6 gap-1">
      <div className="flex items-center gap-2 px-4 mb-8">
        <UtensilsCrossed className="w-7 h-7 text-sidebar-primary" />
        <div className="hidden lg:block">
          <span className="font-heading text-lg font-bold text-sidebar-primary">Abby</span>
          <span className="font-heading text-xs text-sidebar-foreground/60 block -mt-1">RestoPOS</span>
        </div>
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
        <div className="mt-2 mx-3 p-3 rounded-lg bg-warning/10 border border-warning/20 hidden lg:flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
          <p className="text-xs text-sidebar-foreground/80">
            {lowStock} producto{lowStock > 1 ? 's' : ''} con stock bajo
          </p>
        </div>
      )}

      <div className="mt-auto mx-2 space-y-1">
        {displayName && (
          <div className="px-4 py-2 hidden lg:block">
            <p className="text-xs text-sidebar-foreground/60 truncate">{displayName}</p>
            <p className="text-[10px] text-sidebar-foreground/40 capitalize">{role}</p>
          </div>
        )}
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full hover:bg-destructive/10 text-destructive transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:block text-xs font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
