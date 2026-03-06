import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutGrid, UtensilsCrossed, Package, BarChart3, AlertTriangle, Download, Upload, LogOut, Users } from "lucide-react";
import { getLowStockProducts } from "@/lib/store";
import { exportBackup, importBackup } from "@/lib/backup";
import { logout, getCurrentUser } from "@/lib/auth";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const allLinks = [
  { to: "/", icon: LayoutGrid, label: "Mesas", roles: ["admin", "cajero"] },
  { to: "/menu", icon: UtensilsCrossed, label: "Menú", roles: ["admin"] },
  { to: "/inventario", icon: Package, label: "Inventario", roles: ["admin"] },
  { to: "/reportes", icon: BarChart3, label: "Reportes", roles: ["admin", "cajero"] },
  { to: "/usuarios", icon: Users, label: "Usuarios", roles: ["admin"] },
];

export default function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [lowStock, setLowStock] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const user = getCurrentUser();
  const links = allLinks.filter(l => l.roles.includes(user?.role || ""));

  useEffect(() => {
    setLowStock(getLowStockProducts().length);
    const interval = setInterval(() => setLowStock(getLowStockProducts().length), 5000);
    return () => clearInterval(interval);
  }, [location]);

  const handleExport = () => {
    exportBackup();
    toast.success("Respaldo descargado correctamente");
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importBackup(ev.target?.result as string);
        toast.success("Respaldo restaurado. Recargando...");
        setTimeout(() => window.location.reload(), 1000);
      } catch {
        toast.error("Archivo de respaldo inválido");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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
        <button onClick={handleExport} className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full hover:bg-sidebar-accent/50 text-sidebar-foreground transition-colors">
          <Download className="w-4 h-4" />
          <span className="hidden lg:block text-xs font-medium">Respaldar datos</span>
        </button>
        <button onClick={handleImport} className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full hover:bg-sidebar-accent/50 text-sidebar-foreground transition-colors">
          <Upload className="w-4 h-4" />
          <span className="hidden lg:block text-xs font-medium">Restaurar datos</span>
        </button>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />
        <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 rounded-lg w-full hover:bg-destructive/10 text-destructive transition-colors">
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:block text-xs font-medium">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
