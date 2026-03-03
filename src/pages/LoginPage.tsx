import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, initAuth } from "@/lib/auth";
import { UtensilsCrossed, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useState(() => { initAuth(); });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const user = login(username, password);
      if (user) {
        toast.success(`Bienvenido, ${user.username}`);
        navigate("/");
      } else {
        toast.error("Usuario o contraseña incorrectos");
      }
      setLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Abby</h1>
          <p className="text-muted-foreground text-sm">RestoPOS — Sistema de Punto de Venta</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Usuario</label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Contraseña</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Usuarios por defecto: <strong>admin</strong> / admin123 · <strong>cajero</strong> / cajero123
          </p>
        </form>
      </div>
    </div>
  );
}
