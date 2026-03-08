import { useState } from "react";
import { useProducts, useAddProduct, useUpdateProduct, useDeleteProduct, CATEGORIES, type Product } from "@/hooks/useProducts";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const empty = { name: '', category: 'Comida', price: 0, cost: 0, stock: 0, min_stock: 5 };

export default function MenuPage() {
  const { data: products = [] } = useProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [filter, setFilter] = useState('Todos');

  const categories = ['Todos', ...new Set(products.map(p => p.category))];
  const filtered = filter === 'Todos' ? products : products.filter(p => p.category === filter);

  const handleSave = async () => {
    if (!editing || !editing.name) { toast.error("Nombre requerido"); return; }
    try {
      if (isNew) {
        await addProduct.mutateAsync({
          name: editing.name,
          category: editing.category || 'Comida',
          price: editing.price || 0,
          cost: editing.cost || 0,
          stock: editing.stock || 0,
          min_stock: editing.min_stock || 5,
        });
        toast.success("Producto creado");
      } else {
        await updateProduct.mutateAsync({ id: editing.id!, ...editing });
        toast.success("Producto actualizado");
      }
      setEditing(null);
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    }
  };

  const handleDelete = async (id: string) => {
    await deleteProduct.mutateAsync(id);
    toast.success("Producto eliminado");
  };

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
              <span className="text-muted-foreground">Precio: <strong className="text-foreground">${Number(p.price).toFixed(2)}</strong></span>
              <span className={`font-medium ${p.stock <= p.min_stock ? 'text-destructive' : 'text-muted-foreground'}`}>
                Stock: {p.stock}
              </span>
            </div>
          </div>
        ))}
      </div>

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
                <div><label className="text-xs font-medium text-muted-foreground">Stock Mínimo</label><Input type="number" value={editing.min_stock} onChange={e => setEditing({ ...editing, min_stock: +e.target.value })} /></div>
              </div>
              <Button className="w-full" onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Guardar</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
