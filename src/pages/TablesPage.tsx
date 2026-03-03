import { useState, useEffect } from "react";
import { getOrders, createOrder, getProducts, addItemToOrder, removeItemFromOrder, updateItemQty, closeOrder, TABLE_COUNT, type Order, type Product } from "@/lib/store";
import { Plus, Minus, Trash2, X, Printer, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function TablesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showBill, setShowBill] = useState(false);

  const refresh = () => setOrders(getOrders());
  useEffect(() => { refresh(); }, []);

  const openOrders = orders.filter(o => o.status === 'open');
  const getTableOrder = (t: number) => openOrders.find(o => o.tableNumber === t);
  const currentOrder = selectedTable !== null ? getTableOrder(selectedTable) : undefined;

  const handleTableClick = (t: number) => {
    let order = getTableOrder(t);
    if (!order) {
      order = createOrder(t);
      refresh();
    }
    setSelectedTable(t);
  };

  const handleAddProduct = (p: Product) => {
    if (!currentOrder) return;
    addItemToOrder(currentOrder.id, p);
    refresh();
  };

  const handleClose = () => {
    if (!currentOrder) return;
    closeOrder(currentOrder.id);
    refresh();
    setShowBill(false);
    setSelectedTable(null);
    toast.success("Cuenta cerrada correctamente");
  };

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-heading font-bold mb-6">Mesas</h1>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        {Array.from({ length: TABLE_COUNT }, (_, i) => i + 1).map(t => {
          const order = getTableOrder(t);
          const hasItems = order && order.items.length > 0;
          return (
            <button
              key={t}
              onClick={() => handleTableClick(t)}
              className={`rounded-xl p-4 text-center transition-all border-2 ${
                selectedTable === t
                  ? "border-primary bg-primary/10 shadow-md"
                  : hasItems
                  ? "border-success/50 bg-success/5 hover:shadow-md"
                  : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
              }`}
            >
              <span className={`text-2xl font-heading font-bold ${hasItems ? "text-success" : "text-foreground"}`}>{t}</span>
              <p className="text-xs text-muted-foreground mt-1">
                {hasItems ? `${order!.items.length} items` : "Libre"}
              </p>
              {hasItems && <p className="text-xs font-semibold text-success mt-0.5">{fmt(order!.total)}</p>}
            </button>
          );
        })}
      </div>

      {/* Order detail panel */}
      {selectedTable !== null && currentOrder && (
        <div className="glass-card rounded-xl p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">Mesa {selectedTable}</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowMenu(true)}>
                <Plus className="w-4 h-4 mr-1" /> Agregar
              </Button>
              {currentOrder.items.length > 0 && (
                <Button size="sm" onClick={() => setShowBill(true)}>
                  <Printer className="w-4 h-4 mr-1" /> Cerrar Cuenta
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setSelectedTable(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {currentOrder.items.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Sin productos. Agrega desde el menú.</p>
          ) : (
            <div className="space-y-2">
              {currentOrder.items.map(item => (
                <div key={item.productId} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{fmt(item.price)} c/u</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { updateItemQty(currentOrder.id, item.productId, item.quantity - 1); refresh(); }} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                    <button onClick={() => { updateItemQty(currentOrder.id, item.productId, item.quantity + 1); refresh(); }} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => { removeItemFromOrder(currentOrder.id, item.productId); refresh(); }} className="w-7 h-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors ml-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="w-20 text-right font-semibold text-sm">{fmt(item.price * item.quantity)}</p>
                </div>
              ))}
              <div className="border-t border-border pt-3 mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(currentOrder.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA (16%)</span><span>{fmt(currentOrder.tax)}</span></div>
                <div className="flex justify-between font-bold text-base"><span>Total</span><span className="text-primary">{fmt(currentOrder.total)}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add product dialog */}
      <MenuDialog open={showMenu} onClose={() => setShowMenu(false)} onSelect={handleAddProduct} />

      {/* Bill / Close dialog */}
      <Dialog open={showBill} onOpenChange={setShowBill}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-heading">Cuenta - Mesa {selectedTable}</DialogTitle></DialogHeader>
          {currentOrder && (
            <div className="space-y-3">
              <div className="border rounded-lg p-4 space-y-2 text-sm font-mono">
                <p className="text-center font-bold text-base mb-2">RestoPOS</p>
                <p className="text-center text-muted-foreground text-xs">{new Date().toLocaleString('es-MX')}</p>
                <div className="border-t border-dashed my-2" />
                {currentOrder.items.map(i => (
                  <div key={i.productId} className="flex justify-between">
                    <span>{i.quantity}x {i.name}</span>
                    <span>{fmt(i.price * i.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-dashed my-2" />
                <div className="flex justify-between"><span>Subtotal</span><span>{fmt(currentOrder.subtotal)}</span></div>
                <div className="flex justify-between"><span>IVA 16%</span><span>{fmt(currentOrder.tax)}</span></div>
                <div className="flex justify-between font-bold text-base"><span>TOTAL</span><span>{fmt(currentOrder.total)}</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { window.print(); }}>
                  <Printer className="w-4 h-4 mr-1" /> Imprimir
                </Button>
                <Button className="flex-1" onClick={handleClose}>
                  <Check className="w-4 h-4 mr-1" /> Cerrar Cuenta
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenuDialog({ open, onClose, onSelect }: { open: boolean; onClose: () => void; onSelect: (p: Product) => void }) {
  const [products] = useState(() => getProducts());
  const [filter, setFilter] = useState('Todos');
  const categories = ['Todos', ...new Set(products.map(p => p.category))];
  const filtered = filter === 'Todos' ? products : products.filter(p => p.category === filter);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">Agregar Producto</DialogTitle></DialogHeader>
        <div className="flex gap-2 flex-wrap mb-3">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {filtered.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); toast.success(`${p.name} agregado`); }}
              className="text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-primary font-bold text-sm">${p.price.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
