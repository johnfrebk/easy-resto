import { useState, useEffect, useCallback } from "react";
import { syncQueue, getQueueLength } from "@/lib/offlineQueue";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(getQueueLength);
  const queryClient = useQueryClient();

  const refreshPending = useCallback(() => {
    setPendingCount(getQueueLength());
  }, []);

  useEffect(() => {
    const goOnline = async () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      const count = getQueueLength();
      if (count > 0) {
        toast.info(`Sincronizando ${count} operación(es) pendientes…`);
        const result = await syncQueue();
        refreshPending();
        if (result.synced > 0) {
          toast.success(`${result.synced} operación(es) sincronizadas`);
          queryClient.invalidateQueries();
        }
        if (result.failed > 0) {
          toast.error(`${result.failed} operación(es) no pudieron sincronizarse`);
        }
      }
    };

    const goOffline = () => {
      setIsOnline(false);
      toast.warning("Sin conexión — modo offline activado");
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [queryClient, refreshPending]);

  return { isOnline, pendingCount, refreshPending };
}
