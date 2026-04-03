import { NavLink, Outlet } from "react-router-dom";
import { BarChart3, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/reportes", icon: BarChart3, label: "Reporte del Día", end: true },
  { to: "/reportes/reimpresion", icon: FileText, label: "Reimpresión de Documentos" },
];

export default function ReportsLayout() {
  return (
    <div className="animate-fade-in">
      <div className="flex gap-1 mb-6 border-b border-border">
        {tabs.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  );
}
