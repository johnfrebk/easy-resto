import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UserPlus, Trash2, Shield, User } from "lucide-react";
import { toast } from "sonner";
import type { AppRole } from "@/hooks/useAuth";

interface UserWithRole {
  user_id: string;
  display_name: string;
  role: AppRole;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<AppRole>("cajero");
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const { data: profiles } = await supabase.from("profiles").select("user_id, display_name");
    const { data: roles } = await supabase.from("user_roles").select("user_id, role");
    if (!profiles) return;
    const roleMap = new Map((roles || []).map(r => [r.user_id, r.role as AppRole]));
    setUsers(profiles.map(p => ({
      user_id: p.user_id,
      display_name: p.display_name,
      role: roleMap.get(p.user_id) || "cajero",
    })));
  };

  useEffect(() => { refresh(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      toast.error("Completa todos los campos");
      return;
    }
    setLoading(true);

    // Use edge function to create user as admin
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("create-user", {
      body: { email: email.trim(), password, display_name: displayName.trim(), role },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });

    if (res.error) {
      toast.error(res.error.message || "Error al crear usuario");
    } else if (res.data?.error) {
      toast.error(res.data.error);
    } else {
      toast.success(`Usuario "${displayName}" creado`);
      setEmail("");
      setPassword("");
      setDisplayName("");
      setRole("cajero");
      setShowAdd(false);
      refresh();
    }
    setLoading(false);
  };

  const handleDelete = async (u: UserWithRole) => {
    const admins = users.filter(x => x.role === "admin");
    if (admins.length <= 1 && u.role === "admin") {
      toast.error("Debe existir al menos un administrador");
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("delete-user", {
      body: { user_id: u.user_id },
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    if (res.error) {
      toast.error("Error al eliminar usuario");
    } else {
      toast.success(`Usuario "${u.display_name}" eliminado`);
      refresh();
    }
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
          <div key={user.user_id} className="glass-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${user.role === "admin" ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                {user.role === "admin" ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-medium text-foreground">{user.display_name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role === "admin" ? "Administrador" : user.role === "mesero" ? "Mesero" : "Cajero"}
                </p>
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
              <label className="text-sm font-medium text-foreground mb-1.5 block">Nombre</label>
              <Input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="ej. María López" autoFocus required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Correo electrónico</label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="maria@turestaurante.com" required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Contraseña</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Contraseña" required />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Rol</label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador (acceso total)</SelectItem>
                  <SelectItem value="cajero">Cajero (mesas y reportes)</SelectItem>
                  <SelectItem value="mesero">Mesero (solo mesas)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creando..." : "Crear Usuario"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
