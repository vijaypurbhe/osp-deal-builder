-- 1. deals
CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  customer_name text NOT NULL DEFAULT 'Customer',
  partner_name text NOT NULL DEFAULT 'Salesforce',
  currency text NOT NULL DEFAULT 'USD',
  contract_start date,
  contract_end date,
  status text NOT NULL DEFAULT 'Active',
  owner_id uuid,
  owner_name text,
  notes text,
  is_archived boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals read" ON public.deals FOR SELECT TO authenticated USING (true);
CREATE POLICY "deals write" ON public.deals FOR ALL TO authenticated USING (public.can_edit_deal()) WITH CHECK (public.can_edit_deal());
CREATE TRIGGER deals_updated BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. sku_library
CREATE TABLE public.sku_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_code text,
  sku_name text NOT NULL,
  description text,
  product_family text,
  product_category text,
  cloud text,
  unit_of_measure text NOT NULL DEFAULT 'User',
  unit_list_price numeric NOT NULL DEFAULT 0,
  billing_frequency text NOT NULL DEFAULT 'Annual',
  default_tower_key text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sku_library TO authenticated;
GRANT ALL ON public.sku_library TO service_role;
ALTER TABLE public.sku_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sku library read" ON public.sku_library FOR SELECT TO authenticated USING (true);
CREATE POLICY "sku library write" ON public.sku_library FOR ALL TO authenticated USING (public.can_edit_deal()) WITH CHECK (public.can_edit_deal());
CREATE TRIGGER sku_library_updated BEFORE UPDATE ON public.sku_library FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. deal_id columns
ALTER TABLE public.scenarios ADD COLUMN deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE;
ALTER TABLE public.towers ADD COLUMN deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE;
ALTER TABLE public.discussion_items ADD COLUMN deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE;
ALTER TABLE public.risk_log ADD COLUMN deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE;

-- 4. backfill into a first deal
DO $$
DECLARE v_deal uuid;
BEGIN
  INSERT INTO public.deals (name, customer_name, partner_name, currency, status, sort_order, notes)
  VALUES ('Smith+Nephew Salesforce OSP', 'Smith+Nephew', 'Salesforce', 'USD', 'Active', 0,
          'Original OSP deal structure migrated into the multi-deal workspace.')
  RETURNING id INTO v_deal;

  UPDATE public.scenarios SET deal_id = v_deal WHERE deal_id IS NULL;
  UPDATE public.towers SET deal_id = v_deal WHERE deal_id IS NULL;
  UPDATE public.discussion_items SET deal_id = v_deal WHERE deal_id IS NULL;
  UPDATE public.risk_log SET deal_id = v_deal WHERE deal_id IS NULL;

  UPDATE public.deals d SET
    contract_start = (SELECT min(contract_start) FROM public.scenarios WHERE deal_id = v_deal),
    contract_end = (SELECT max(contract_end) FROM public.scenarios WHERE deal_id = v_deal)
  WHERE d.id = v_deal;

  INSERT INTO public.sku_library
    (sku_code, sku_name, description, product_family, product_category, cloud,
     unit_of_measure, unit_list_price, billing_frequency, default_tower_key)
  SELECT DISTINCT ON (sku_name, unit_list_price, unit_of_measure)
    sku_code, sku_name, description, product_family, product_category, cloud,
    unit_of_measure, unit_list_price, billing_frequency, tower_key
  FROM public.sku_lines
  WHERE scenario_id IN (SELECT id FROM public.scenarios WHERE deal_id = v_deal AND is_baseline = true)
  ORDER BY sku_name, unit_list_price, unit_of_measure;
END $$;

ALTER TABLE public.scenarios ALTER COLUMN deal_id SET NOT NULL;
ALTER TABLE public.towers ALTER COLUMN deal_id SET NOT NULL;
ALTER TABLE public.discussion_items ALTER COLUMN deal_id SET NOT NULL;
ALTER TABLE public.risk_log ALTER COLUMN deal_id SET NOT NULL;

CREATE INDEX idx_scenarios_deal ON public.scenarios(deal_id);
CREATE INDEX idx_towers_deal ON public.towers(deal_id);
CREATE INDEX idx_discussion_deal ON public.discussion_items(deal_id);
CREATE INDEX idx_risk_deal ON public.risk_log(deal_id);