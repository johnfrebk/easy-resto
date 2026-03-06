import { useState, useEffect } from "react";
import { getUsers, addUser, deleteUser, type StoredUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Trash2, Shield, User } from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
  const [users, setUsers] = useState<StoredUser[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "cajero">("cajero");

  const refresh = () => setUsers(getUsers());
  useEffect(() => { refresh(); }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.error("Completa todos los campos");
      return;
    }
    if (users.some(u => u.username === username.trim())) {
      toast.error("Ese nombre de usuario ya existe");
      return;
    }
    addUser(username.trim(), password, role);
    toast.success(`Usuario "${username}" creado`);
    setUsername("");
    setPassword("");
    setRole("cajero");
    setShowAdd(false);
    refresh();
  };

  const handleDelete = (user: StoredUser) => {
    if (users.filter(u => u.role === "admin").length <= 1 && user.role === "admin") {
      toast.error("Debe existir al menos un administrador");
      return;
    }
    deleteUser(user.id);
    toast.success(`Usuario "${user.username}" eliminado`);
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Usuarios</h1>
          <p className="text-muted-foreground text-sm">Administra los usuarios del sistema</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <UserPlus className="w-4 h-4 mr-2" /> Nuevo Usuario
        </Button>
      </div>

      <div className="grid gap-3">
        {users.map(user => (
          <div key={user.id} className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                {user.role === "admin" ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-medium text-foreground">{user.username}</p>
                <p className="text-xs text-muted-foreground capitalize">{user.role === "admin" ? "Administrador" : "Cajero"}</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(user)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear Usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nombre de usuario</label>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="ej. maria" autoFocus required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Contraseña</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Rol</label>
              <Select value={role} onValueChange={(v) => setRole(v as "admin" | "cajero")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador (acceso total)</SelectItem>
                  <SelectItem value="cajero">Cajero (solo mesas y reportes)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full">Crear Usuario</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
