import { useState } from "react";
import { fmtCOP } from "@/lib/currency";
import { useAuth } from "@/hooks/useAuth";
import { useTables, useAddTable, useRemoveTable } from "@/hooks/useTables";
import { useOpenOrders, useCreateOrder, useAddItemToOrder, useUpdateItemQty, useRemoveItem, useCloseOrder } from "@/hooks/useOrders";
import { useProducts, type Product } from "@/hooks/useProducts";
import { useBusinessConfig, INVOICE_FIELD_LABELS, BUSINESS_TYPE_LABELS } from "@/hooks/useBusinessConfig";
import { Plus, Minus, Trash2, X, Printer, Check, PlusCircle, Trash, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function TablesPage() {
  const { user, isAdmin } = useAuth();
  const { data: businessConfig } = useBusinessConfig();
  const { data: tables = [] } = useTables();
  const { data: openOrders = [] } = useOpenOrders();
  const createOrder = useCreateOrder();
  const addItem = useAddItemToOrder();
  const updateQty = useUpdateItemQty();
  const removeItem = useRemoveItem();
  const closeOrder = useCloseOrder();
  const addTable = useAddTable();
  const removeTable = useRemoveTable();

  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showBill, setShowBill] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const getTableOrder = (tableId: string) => openOrders.find(o => o.table_id === tableId);
  const selectedTable = tables.find(t => t.id === selectedTableId);
  const currentOrder = selectedTableId ? getTableOrder(selectedTableId) : undefined;

  const handleTableClick = async (table: typeof tables[0]) => {
    if (editMode) return;
    let order = getTableOrder(table.id);
    if (!order) {
      const newOrder = await createOrder.mutateAsync({
        tableId: table.id,
        tableNumber: table.table_number,
        userId: user?.id,
      });
      order = newOrder;
    }
    setSelectedTableId(table.id);
  };

  const handleAddTable = async () => {
    const t = await addTable.mutateAsync();
    toast.success(`Mesa ${t.table_number} creada`);
  };

  const handleRemoveTable = async (table: typeof tables[0]) => {
    const hasOpen = openOrders.some(o => o.table_id === table.id);
    if (hasOpen) {
      toast.error(`No se puede eliminar la mesa ${table.table_number} porque tiene una orden abierta`);
      return;
    }
    await removeTable.mutateAsync(table.id);
    if (selectedTableId === table.id) setSelectedTableId(null);
    toast.success(`Mesa ${table.table_number} eliminada`);
  };

  const handleAddProduct = async (p: Product) => {
    if (!currentOrder) return;
    await addItem.mutateAsync({
      orderId: currentOrder.id,
      productId: p.id,
      productName: p.name,
      price: p.price,
      quantity: 1,
    });
    toast.success(`${p.name} agregado`);
  };

  const handleClose = async () => {
    if (!currentOrder) return;
    await closeOrder.mutateAsync({ orderId: currentOrder.id, userId: user?.id });
    setShowBill(false);
    setSelectedTableId(null);
    toast.success("Cuenta cerrada correctamente");
  };

  const fmt = fmtCOP;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Mesas</h1>
        {isAdmin() && (
          <div className="flex gap-2">
            <Button size="sm" variant={editMode ? "default" : "outline"} onClick={() => setEditMode(!editMode)}>
              {editMode ? <><Check className="w-4 h-4 mr-1" /> Listo</> : <><Trash className="w-4 h-4 mr-1" /> Editar</>}
            </Button>
            <Button size="sm" variant="outline" onClick={handleAddTable}>
              <PlusCircle className="w-4 h-4 mr-1" /> Nueva Mesa
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
        {tables.map(t => {
          const order = getTableOrder(t.id);
          const hasItems = order && order.items.length > 0;
          return (
            <div key={t.id} className="relative">
              {editMode && (
                <button
                  onClick={() => handleRemoveTable(t)}
                  className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => handleTableClick(t)}
                className={`w-full rounded-xl p-4 text-center transition-all border-2 ${
                  editMode
                    ? "border-destructive/30 bg-destructive/5 animate-pulse"
                    : selectedTableId === t.id
                    ? "border-primary bg-primary/10 shadow-md"
                    : hasItems
                    ? "border-success/50 bg-success/5 hover:shadow-md"
                    : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                }`}
              >
                <span className={`text-2xl font-heading font-bold ${hasItems ? "text-success" : "text-foreground"}`}>{t.table_number}</span>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasItems ? `${order!.items.length} items` : "Libre"}
                </p>
                {hasItems && <p className="text-xs font-semibold text-success mt-0.5">{fmt(order!.total)}</p>}
              </button>
            </div>
          );
        })}
      </div>

      {/* Order detail panel */}
      {selectedTable && currentOrder && !editMode && (
        <div className="glass-card rounded-xl p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-lg">Mesa {selectedTable.table_number}</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowMenu(true)}>
                <Plus className="w-4 h-4 mr-1" /> Agregar
              </Button>
              {currentOrder.items.length > 0 && (
                <Button size="sm" onClick={() => setShowBill(true)}>
                  <Printer className="w-4 h-4 mr-1" /> Cerrar Cuenta
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setSelectedTableId(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {currentOrder.items.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Sin productos. Agrega desde el menú.</p>
          ) : (
            <div className="space-y-2">
              {currentOrder.items.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-4 py-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product_name}</p>
                    <p className="text-xs text-muted-foreground">{fmt(item.price)} c/u</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty.mutate({ itemId: item.id, quantity: item.quantity - 1, orderId: currentOrder.id })} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty.mutate({ itemId: item.id, quantity: item.quantity + 1, orderId: currentOrder.id })} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeItem.mutate({ itemId: item.id, orderId: currentOrder.id })} className="w-7 h-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors ml-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="w-20 text-right font-semibold text-sm">{fmt(Number(item.price) * item.quantity)}</p>
                </div>
              ))}
              <div className="border-t border-border pt-3 mt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(currentOrder.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IVA</span><span>{fmt(currentOrder.tax)}</span></div>
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
          <DialogHeader><DialogTitle className="font-heading">Cuenta - Mesa {selectedTable?.table_number}</DialogTitle></DialogHeader>
          {currentOrder && (
            <div className="space-y-3">
               <div className="border rounded-lg p-4 space-y-2 text-sm font-mono">
                 {businessConfig && (
                   <InvoiceHeader config={businessConfig} />
                 )}
                 <p className="text-center text-muted-foreground text-xs">{new Date().toLocaleString('es-CO')}</p>
                 <p className="text-center text-muted-foreground text-xs">Mesa {selectedTable?.table_number}</p>
                 <div className="border-t border-dashed my-2" />
                 {currentOrder.items.map(i => (
                   <div key={i.id} className="flex justify-between">
                     <span>{i.quantity}x {i.product_name}</span>
                     <span>{fmt(Number(i.price) * i.quantity)}</span>
                   </div>
                 ))}
                 <div className="border-t border-dashed my-2" />
                 <div className="flex justify-between"><span>Subtotal</span><span>{fmt(currentOrder.subtotal)}</span></div>
                 <div className="flex justify-between"><span>IVA</span><span>{fmt(currentOrder.tax)}</span></div>
                 <div className="flex justify-between font-bold text-base"><span>TOTAL</span><span>{fmt(currentOrder.total)}</span></div>
                 {businessConfig?.invoice_fields.includes("invoice_message") && businessConfig.invoice_message && (
                   <p className="text-center text-xs text-muted-foreground mt-2 italic">{businessConfig.invoice_message}</p>
                 )}
               </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => window.print()}>
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
  const { data: products = [] } = useProducts();
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const categories = ['Todos', ...new Set(products.map(p => p.category))];
  const filtered = (filter === 'Todos' ? products : products.filter(p => p.category === filter))
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { setSearch(''); setFilter('Todos'); } onClose(); }}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-heading">Agregar Producto</DialogTitle></DialogHeader>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-2 flex-wrap mb-3">
          {categories.map(c => (
            <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {filtered.length === 0 ? (
            <p className="col-span-2 text-center text-muted-foreground text-sm py-8">No se encontraron productos</p>
          ) : filtered.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); }}
              className="text-left p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
            >
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-primary font-bold text-sm">{fmtCOP(Number(p.price))}</p>
              <p className="text-xs text-muted-foreground">Stock: {p.stock}</p>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
