
-- Business config table
CREATE TABLE public.business_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.business_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view config" ON public.business_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage config" ON public.business_config FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default values for Colombia
INSERT INTO public.business_config (key, value) VALUES
  ('iva_enabled', 'true'),
  ('iva_rate', '19'),
  ('iva_included_in_price', 'false'),
  ('business_name', 'Abby RestoPOS');

-- Add per-product IVA override fields
ALTER TABLE public.products
  ADD COLUMN iva_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN iva_rate numeric NOT NULL DEFAULT 19,
  ADD COLUMN iva_included boolean NOT NULL DEFAULT false;

-- Trigger for updated_at on business_config
CREATE TRIGGER update_business_config_updated_at
  BEFORE UPDATE ON public.business_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
