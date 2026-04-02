import { useEffect, useState } from "react";
import {
  useBusinessConfig,
  useUpdateBusinessConfig,
  BusinessType,
  BUSINESS_TYPE_LABELS,
  INVOICE_FIELD_LABELS,
} from "@/hooks/useBusinessConfig";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Settings, Receipt } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { data: config, isLoading } = useBusinessConfig();
  const updateConfig = useUpdateBusinessConfig();

  const [businessName, setBusinessName] = useState("");
  const [nitRut, setNitRut] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [closingHours, setClosingHours] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("restaurante");
  const [invoiceMessage, setInvoiceMessage] = useState("");
  const [socialMedia, setSocialMedia] = useState("");
  const [website, setWebsite] = useState("");
  const [invoiceFields, setInvoiceFields] = useState<string[]>(["business_name"]);

  const [ivaEnabled, setIvaEnabled] = useState(true);
  const [ivaRate, setIvaRate] = useState(19);
  const [ivaIncluded, setIvaIncluded] = useState(false);

  useEffect(() => {
    if (config) {
      setBusinessName(config.business_name);
      setNitRut(config.nit_rut);
      setAddress(config.address);
      setCity(config.city);
      setPhone(config.phone);
      setEmail(config.email);
      setOpeningHours(config.opening_hours);
      setClosingHours(config.closing_hours);
      setBusinessType(config.business_type);
      setInvoiceMessage(config.invoice_message);
      setSocialMedia(config.social_media);
      setWebsite(config.website);
      setInvoiceFields(config.invoice_fields);
      setIvaEnabled(config.iva_enabled);
      setIvaRate(config.iva_rate);
      setIvaIncluded(config.iva_included_in_price);
    }
  }, [config]);

  const toggleInvoiceField = (field: string) => {
    if (field === "business_name") return; // obligatorio
    setInvoiceFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
    );
  };

  const handleSave = async () => {
    if (!businessName.trim()) {
      toast.error("El nombre del negocio es obligatorio");
      return;
    }
    try {
      await updateConfig.mutateAsync({
        business_name: businessName.trim(),
        nit_rut: nitRut.trim(),
        address: address.trim(),
        city: city.trim(),
        phone: phone.trim(),
        email: email.trim(),
        opening_hours: openingHours,
        closing_hours: closingHours,
        business_type: businessType,
        invoice_message: invoiceMessage.trim(),
        social_media: socialMedia.trim(),
        website: website.trim(),
        invoice_fields: invoiceFields,
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="businessName">Nombre del negocio *</Label>
            <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="nitRut">NIT / RUT</Label>
            <Input id="nitRut" value={nitRut} onChange={(e) => setNitRut(e.target.value)} className="mt-1" placeholder="900.123.456-7" />
          </div>
          <div>
            <Label htmlFor="businessType">Tipo de negocio</Label>
            <Select value={businessType} onValueChange={(v) => setBusinessType(v as BusinessType)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(BUSINESS_TYPE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" placeholder="+57 300 000 0000" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="website">Página web</Label>
            <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} className="mt-1" placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="openingHours">Hora de apertura</Label>
            <Input id="openingHours" type="time" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label htmlFor="closingHours">Hora de cierre</Label>
            <Input id="closingHours" type="time" value={closingHours} onChange={(e) => setClosingHours(e.target.value)} className="mt-1" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="socialMedia">Redes sociales</Label>
            <Input id="socialMedia" value={socialMedia} onChange={(e) => setSocialMedia(e.target.value)} className="mt-1" placeholder="@mi_negocio" />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="invoiceMessage">Mensaje en factura</Label>
            <Textarea id="invoiceMessage" value={invoiceMessage} onChange={(e) => setInvoiceMessage(e.target.value)} className="mt-1" rows={2} placeholder="¡Gracias por su compra!" />
          </div>
        </div>
      </div>

      {/* Campos visibles en la factura */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Receipt className="w-5 h-5 text-primary" />
          <h2 className="font-heading font-semibold text-lg">Datos visibles en la factura</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Selecciona qué información aparecerá en los recibos y facturas impresas.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(INVOICE_FIELD_LABELS).map(([field, label]) => {
            const isMandatory = field === "business_name";
            return (
              <div key={field} className="flex items-center gap-2">
                <Checkbox
                  id={`inv-${field}`}
                  checked={invoiceFields.includes(field)}
                  disabled={isMandatory}
                  onCheckedChange={() => toggleInvoiceField(field)}
                />
                <Label htmlFor={`inv-${field}`} className="text-sm cursor-pointer">
                  {label} {isMandatory && <span className="text-muted-foreground">(obligatorio)</span>}
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Configuración de IVA */}
      <div className="glass-card rounded-xl p-6 mb-6">
        <h2 className="font-heading font-semibold text-lg mb-4">Configuración de IVA</h2>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ivaEnabled">Manejar IVA</Label>
              <p className="text-xs text-muted-foreground">Activar el cobro de IVA en los productos</p>
            </div>
            <Switch id="ivaEnabled" checked={ivaEnabled} onCheckedChange={setIvaEnabled} />
          </div>
          {ivaEnabled && (
            <>
              <div>
                <Label htmlFor="ivaRate">Porcentaje de IVA (%)</Label>
                <Input id="ivaRate" type="number" min={0} max={100} value={ivaRate} onChange={(e) => setIvaRate(Math.round(Number(e.target.value)))} className="mt-1 max-w-[120px]" />
                <p className="text-xs text-muted-foreground mt-1">En Colombia el IVA general es del 19%.</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ivaIncluded">IVA incluido en el precio</Label>
                  <p className="text-xs text-muted-foreground">Si está activo, el precio del producto ya incluye el IVA.</p>
                </div>
                <Switch id="ivaIncluded" checked={ivaIncluded} onCheckedChange={setIvaIncluded} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="bg-secondary/50 rounded-xl p-4 mb-6 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">💡 Configuración por producto</p>
        <p>Estos valores de IVA se usan como predeterminados al crear un producto. Puedes personalizarlos individualmente desde el módulo de Menú.</p>
      </div>

      <Button onClick={handleSave} disabled={updateConfig.isPending} className="w-full sm:w-auto">
        <Save className="w-4 h-4 mr-1" />
        {updateConfig.isPending ? "Guardando..." : "Guardar Configuración"}
      </Button>
    </div>
  );
}
