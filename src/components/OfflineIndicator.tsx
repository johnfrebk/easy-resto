import { Wifi, WifiOff, CloudUpload } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { syncQueue } from "@/lib/offlineQueue";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function OfflineIndicator() {
  const { isOnline, pendingCount, refreshPending } = useOnlineStatus();
  const queryClient = useQueryClient();

  const handleManualSync = async () => {
    if (!isOnline) {
      toast.error("No hay conexión a internet");
      return;
    }
    toast.info("Sincronizando…");
    const result = await syncQueue();
    refreshPending();
    if (result.synced > 0) {
      toast.success(`${result.synced} operación(es) sincronizadas`);
      queryClient.invalidateQueries();
    }
    if (result.failed > 0) {
      toast.error(`${result.failed} operación(es) fallaron`);
    }
    if (result.synced === 0 && result.failed === 0) {
      toast.info("No hay operaciones pendientes");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isOnline ? (
        <Badge variant="outline" className="gap-1.5 text-emerald-600 border-emerald-200 bg-emerald-50">
          <Wifi className="h-3 w-3" />
          En línea
        </Badge>
      ) : (
        <Badge variant="outline" className="gap-1.5 text-amber-600 border-amber-200 bg-amber-50">
          <WifiOff className="h-3 w-3" />
          Sin conexión
        </Badge>
      )}
      {pendingCount > 0 && (
        <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs" onClick={handleManualSync}>
          <CloudUpload className="h-3 w-3" />
          {pendingCount} pendiente{pendingCount > 1 ? "s" : ""}
        </Button>
      )}
    </div>
  );
}
