import { useEffect, useState } from "react";
import { useBusinessConfig, useUpdateBusinessConfig } from "@/hooks/useBusinessConfig";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Save, Settings } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: config, isLoading } = useBusinessConfig();
  const updateConfig = useUpdateBusinessConfig();

  const [businessName, setBusinessName] = useState("");
  const [ivaEnabled, setIvaEnabled] = useState(true);
  const [ivaRate, setIvaRate] = useState(19);
  const [ivaIncluded, setIvaIncluded] = useState(false);

  useEffect(() => {
    if (config) {
      setBusinessName(config.business_name);
      setIvaEnabled(config.iva_enabled);
      setIvaRate(config.iva_rate);
      setIvaIncluded(config.iva_included_in_price);
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync({
        business_name: businessName,
        iva_enabled: ivaEnabled,
        iva_rate: ivaRate,
        iva_included_in_price: ivaIncluded,
      });
      toast.success("Configuración guardada");
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-heading font-bold">Configuración</h1>
      </div>

      {/* Datos del Negocio */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <h2 className="font-heading font-semibold text-lg mb-4">Datos del Negocio</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="businessName">Nombre del negocio</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Se muestra en facturas y recibos
            </p>
          </div>
        </div>
      </div>

      {/* Configuración de IVA */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <h2 className="font-heading font-semibold text-lg mb-4">Configuración de IVA</h2>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ivaEnabled">Manejar IVA</Label>
              <p className="text-xs text-muted-foreground">
                Activar el cobro de IVA en los productos
              </p>
            </div>
            <Switch
              id="ivaEnabled"
              checked={ivaEnabled}
              onCheckedChange={setIvaEnabled}
            />
          </div>

          {ivaEnabled && (
            <>
              <div>
                <Label htmlFor="ivaRate">Porcentaje de IVA (%)</Label>
                <Input
                  id="ivaRate"
                  type="number"
                  min={0}
                  max={100}
                  value={ivaRate}
                  onChange={(e) => setIvaRate(Math.round(Number(e.target.value)))}
                  className="mt-1 max-w-[120px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  En Colombia el IVA general es del 19%. Algunos productos manejan 5% o 0%.
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ivaIncluded">IVA incluido en el precio</Label>
                  <p className="text-xs text-muted-foreground">
                    Si está activo, el precio del producto ya incluye el IVA.
                    Si no, el IVA se suma al precio base.
                  </p>
                </div>
                <Switch
                  id="ivaIncluded"
                  checked={ivaIncluded}
                  onCheckedChange={setIvaIncluded}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">💡 Configuración por producto</p>
        <p>
          Estos valores se usan como predeterminados al crear un producto nuevo.
          Puedes personalizar el IVA de cada producto individualmente desde el módulo de Menú.
        </p>
      </div>

      <Button onClick={handleSave} disabled={updateConfig.isPending} className="w-full sm:w-auto">
        <Save className="w-4 h-4 mr-1" />
        {updateConfig.isPending ? "Guardando..." : "Guardar Configuración"}
      </Button>
    </div>
  );
}
