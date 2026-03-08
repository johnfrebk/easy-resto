import { useState } from "react";
import { useProducts, useLowStockProducts } from "@/hooks/useProducts";
import { useInventoryLogs, useAddInventoryEntry } from "@/hooks/useInventory";
import { useAuth } from "@/hooks/useAuth";
import { Package, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function InventoryPage() {
  const { user } = useAuth();
  const { data: products = [] } = useProducts();
  const { data: lowStock = [] } = useLowStockProducts();
  const { data: logs = [] } = useInventoryLogs();
  const addEntry = useAddInventoryEntry();

  const [showEntry, setShowEntry] = useState(false);
  const [entryProduct, setEntryProduct] = useState("");
  const [entryType, setEntryType] = useState<"entrada" | "salida">("entrada");
  const [entryQty, setEntryQty] = useState(1);

  const handleEntry = async () => {
    if (!entryProduct) { toast.error("Selecciona un producto"); return; }
    try {
      await addEntry.mutateAsync({ productId: entryProduct, type: entryType, quantity: entryQty, userId: user?.id });
      toast.success(`${entryType === "entrada" ? "Entrada" : "Salida"} registrada`);
      setShowEntry(false);
    } catch (e: any) {
      toast.error(e.message || "Error");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Inventario</h1>
        <Button onClick={() => setShowEntry(true)}>
          <Package className="w-4 h-4 mr-1" /> Registrar Movimiento
        </Button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <h3 className="font-heading font-semibold">Productos con Stock Bajo</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(p => (
              <span key={p.id} className="px-3 py-1 rounded-full bg-warning/20 text-sm font-medium">
                {p.name}: <strong>{p.stock}</strong> (mín: {p.min_stock})
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-secondary/50">
            <th className="text-left p-3 font-medium">Producto</th>
            <th className="text-left p-3 font-medium">Categoría</th>
            <th className="text-right p-3 font-medium">Stock</th>
            <th className="text-right p-3 font-medium">Mínimo</th>
            <th className="text-right p-3 font-medium">Estado</th>
          </tr></thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3 text-muted-foreground">{p.category}</td>
                <td className="p-3 text-right font-semibold">{p.stock}</td>
                <td className="p-3 text-right text-muted-foreground">{p.min_stock}</td>
                <td className="p-3 text-right">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.stock <= p.min_stock ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                    {p.stock <= p.min_stock ? 'Bajo' : 'OK'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="font-heading font-bold text-lg mb-3">Movimientos Recientes</h2>
      <div className="space-y-2">
        {logs.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Sin movimientos registrados.</p>}
        {logs.slice(0, 20).map(log => (
          <div key={log.id} className="flex items-center gap-3 bg-card rounded-lg p-3 border border-border/50 text-sm">
            {log.type === "entrada" ? <ArrowUpCircle className="w-4 h-4 text-success" /> : <ArrowDownCircle className="w-4 h-4 text-destructive" />}
            <span className="flex-1"><strong>{log.product_name}</strong> — {log.type} de {log.quantity} unidades</span>
            <span className="text-muted-foreground text-xs">{new Date(log.created_at).toLocaleString("es-MX")}</span>
          </div>
        ))}
      </div>

      <Dialog open={showEntry} onOpenChange={setShowEntry}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">Registrar Movimiento</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-muted-foreground">Producto</label>
              <Select value={entryProduct} onValueChange={setEntryProduct}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Tipo</label>
              <Select value={entryType} onValueChange={v => setEntryType(v as "entrada" | "salida")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="salida">Salida</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">Cantidad</label><Input type="number" min={1} value={entryQty} onChange={e => setEntryQty(+e.target.value)} /></div>
            <Button className="w-full" onClick={handleEntry}>Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
