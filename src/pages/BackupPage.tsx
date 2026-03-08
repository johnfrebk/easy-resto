import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Download, Upload, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const TABLES = ["products", "tables", "orders", "order_items", "inventory_logs", "profiles", "user_roles"] as const;
type TableName = typeof TABLES[number];

export default function BackupPage() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const backup: Record<string, unknown> = {};
      for (const table of TABLES) {
        const { data, error } = await supabase.from(table).select("*");
        if (error) throw new Error(`Error exportando ${table}: ${error.message}`);
        backup[table] = data;
      }
      backup._app = "Abby-RestoPOS";
      backup._version = 2;
      backup._exportedAt = new Date().toISOString();

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `abby-restopos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Copia de seguridad exportada correctamente");
    } catch (e: any) {
      toast.error(e.message || "Error al exportar");
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data._app !== "Abby-RestoPOS") {
        throw new Error("Archivo de respaldo inválido: no es un backup de Abby-RestoPOS");
      }

      // Restore order matters: delete dependents first, then parents
      const deleteOrder: TableName[] = ["order_items", "inventory_logs", "orders", "user_roles", "profiles", "products", "tables"];
      for (const table of deleteOrder) {
        const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) console.warn(`Aviso al limpiar ${table}:`, error.message);
      }

      // Insert order: parents first, then dependents
      const insertOrder: TableName[] = ["tables", "products", "profiles", "user_roles", "orders", "order_items", "inventory_logs"];
      for (const table of insertOrder) {
        const rows = data[table];
        if (!rows || !Array.isArray(rows) || rows.length === 0) continue;
        // Insert in batches of 500
        for (let i = 0; i < rows.length; i += 500) {
          const batch = rows.slice(i, i + 500);
          const { error } = await supabase.from(table).insert(batch);
          if (error) throw new Error(`Error restaurando ${table}: ${error.message}`);
        }
      }

      toast.success("Copia de seguridad restaurada correctamente. Recargando...");
      setTimeout(() => window.location.reload(), 1500);
    } catch (e: any) {
      toast.error(e.message || "Error al importar");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const busy = exporting || importing;

  return (
    <div className="animate-fade-in max-w-2xl">
      <h1 className="text-2xl font-heading font-bold mb-2">Copia de Seguridad</h1>
      <p className="text-muted-foreground text-sm mb-8">
        Exporta o restaura todos los datos del sistema: productos, mesas, órdenes, inventario y usuarios.
      </p>

      <div className="space-y-4">
        {/* Export */}
        <div className="glass-card rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Download className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading font-semibold text-lg">Exportar Respaldo</h2>
            <p className="text-muted-foreground text-sm">
              Descarga un archivo JSON con todos los datos actuales de la base de datos.
            </p>
          </div>
          <Button onClick={handleExport} disabled={busy} className="gap-2 shrink-0">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar
          </Button>
        </div>

        {/* Import */}
        <div className="glass-card rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
            <Upload className="w-6 h-6 text-warning" />
          </div>
          <div className="flex-1">
            <h2 className="font-heading font-semibold text-lg">Restaurar Respaldo</h2>
            <p className="text-muted-foreground text-sm">
              Sube un archivo de respaldo previamente exportado. <strong className="text-destructive">Esto reemplazará todos los datos actuales.</strong>
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="gap-2 shrink-0 border-warning/50 text-warning hover:bg-warning/10"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Restaurar
          </Button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
        </div>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">Importante:</strong> Al restaurar un respaldo, todos los datos actuales serán eliminados y reemplazados por los datos del archivo. Asegúrate de exportar un respaldo antes de restaurar.
          </div>
        </div>
      </div>
    </div>
  );
}
