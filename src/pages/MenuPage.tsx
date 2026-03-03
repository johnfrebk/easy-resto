import { useState, useEffect } from "react";
import { getProducts, addProduct, updateProduct, deleteProduct, CATEGORIES, type Product } from "@/lib/store";
import { Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const empty = { name: '', category: 'Comida', price: 0, cost: 0, stock: 0, minStock: 5 };

export default function MenuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const refresh = () => setProducts(getProducts());
  useEffect(() => { refresh(); }, []);

  const handleSave = () => {
    if (!editing || !editing.name) { toast.error("Nombre requerido"); return; }
    if (isNew) {
      addProduct(editing as Omit<Product, 'id'>);
      toast.success("Producto creado");
    } else {
      updateProduct(editing.id!, editing);
      toast.success("Producto actualizado");
    }
    setEditing(null);
    refresh();
  };

  const handleDelete = (id: string) => {
    deleteProduct(id);
    toast.success("Producto eliminado");
    refresh();
  };

  const categories = ['Todos', ...new Set(products.map(p => p.category))];
  const [filter, setFilter] = useState('Todos');
  const filtered = filter === 'Todos' ? products : products.filter(p => p.category === filter);

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Menú / Productos</h1>
        <Button onClick={() => { setEditing({ ...empty }); setIsNew(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Nuevo Producto
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {categories.map(c => (
          <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => (
          <div key={p.id} className="stat-card flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold">{p.name}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{p.category}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing({ ...p }); setIsNew(false); }} className="p-1.5 rounded-md hover:bg-secondary transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
            </div>
            <div className="mt-auto pt-2 flex justify-between text-sm">
              <span className="text-muted-foreground">Precio: <strong className="text-foreground">${p.price}</strong></span>
              <span className={`font-medium ${p.stock <= p.minStock ? 'text-destructive' : 'text-muted-foreground'}`}>
                Stock: {p.stock}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="font-heading">{isNew ? "Nuevo Producto" : "Editar Producto"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-muted-foreground">Nombre</label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Categoría</label>
                <Select value={editing.category} onValueChange={v => setEditing({ ...editing, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-muted-foreground">Precio</label><Input type="number" value={editing.price} onChange={e => setEditing({ ...editing, price: +e.target.value })} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Costo</label><Input type="number" value={editing.cost} onChange={e => setEditing({ ...editing, cost: +e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium text-muted-foreground">Stock</label><Input type="number" value={editing.stock} onChange={e => setEditing({ ...editing, stock: +e.target.value })} /></div>
                <div><label className="text-xs font-medium text-muted-foreground">Stock Mínimo</label><Input type="number" value={editing.minStock} onChange={e => setEditing({ ...editing, minStock: +e.target.value })} /></div>
              </div>
              <Button className="w-full" onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Guardar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
