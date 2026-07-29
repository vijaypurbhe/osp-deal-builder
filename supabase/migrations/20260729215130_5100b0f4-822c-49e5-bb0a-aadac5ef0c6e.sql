-- Roles
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'deal_architect';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'salesforce_ae';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tm_osp_lead';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sn_reviewer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance_reviewer';

CREATE OR REPLACE FUNCTION public.can_edit_deal()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text IN ('deal_architect','salesforce_ae','tm_osp_lead')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_deal_architect()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role::text = 'deal_architect'
  );
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  display_name text,
  organisation text,
  job_title text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by signed in" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- user_roles write access for deal architects
GRANT INSERT, DELETE ON public.user_roles TO authenticated;
CREATE POLICY "roles readable by signed in" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "architects manage roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_deal_architect());
CREATE POLICY "architects delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_deal_architect());

-- Towers
CREATE TABLE public.towers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  decision_status text NOT NULL DEFAULT 'Draft',
  confidence text NOT NULL DEFAULT 'Medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.towers TO authenticated;
GRANT ALL ON public.towers TO service_role;
ALTER TABLE public.towers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "towers read" ON public.towers FOR SELECT TO authenticated USING (true);
CREATE POLICY "towers write" ON public.towers FOR ALL TO authenticated USING (public.can_edit_deal()) WITH CHECK (public.can_edit_deal());
CREATE TRIGGER towers_updated BEFORE UPDATE ON public.towers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Scenarios
CREATE TABLE public.scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Draft',
  owner_name text,
  owner_id uuid,
  is_locked boolean NOT NULL DEFAULT false,
  is_baseline boolean NOT NULL DEFAULT false,
  is_recommended boolean NOT NULL DEFAULT false,
  notes text,
  currency text NOT NULL DEFAULT 'USD',
  contract_start date,
  contract_end date,
  scenario_discount_pct numeric NOT NULL DEFAULT 0,
  bulk_discount_pct numeric NOT NULL DEFAULT 0,
  bulk_discount_mode text NOT NULL DEFAULT 'recurring',
  strategic_override_pct numeric NOT NULL DEFAULT 0,
  approval_threshold_pct numeric NOT NULL DEFAULT 40,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scenarios TO authenticated;
GRANT ALL ON public.scenarios TO service_role;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scenarios read" ON public.scenarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "scenarios write" ON public.scenarios FOR ALL TO authenticated USING (public.can_edit_deal()) WITH CHECK (public.can_edit_deal());
CREATE TRIGGER scenarios_updated BEFORE UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SKU lines
CREATE TABLE public.sku_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  tower_key text,
  sku_code text,
  sku_name text NOT NULL,
  description text,
  product_family text,
  product_category text,
  cloud text,
  classification text NOT NULL DEFAULT 'Current baseline',
  bom_type text NOT NULL DEFAULT 'revised',
  quantity numeric NOT NULL DEFAULT 0,
  unit_of_measure text NOT NULL DEFAULT 'User',
  unit_list_price numeric NOT NULL DEFAULT 0,
  billing_frequency text NOT NULL DEFAULT 'Annual',
  line_discount_pct numeric NOT NULL DEFAULT 0,
  category_discount_pct numeric NOT NULL DEFAULT 0,
  bulk_eligible boolean NOT NULL DEFAULT true,
  discountable boolean NOT NULL DEFAULT true,
  max_discount_pct numeric NOT NULL DEFAULT 60,
  approval_threshold_pct numeric NOT NULL DEFAULT 40,
  discount_reason text,
  year1_qty numeric,
  year2_qty numeric,
  year3_qty numeric,
  start_date date,
  end_date date,
  coterm_date date,
  proration_method text NOT NULL DEFAULT 'None',
  approval_status text NOT NULL DEFAULT 'Draft',
  assumption_owner text,
  needs_salesforce_confirmation boolean NOT NULL DEFAULT false,
  needs_sn_confirmation boolean NOT NULL DEFAULT false,
  notes text,
  source_tab text,
  source_file text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sku_lines_scenario_idx ON public.sku_lines(scenario_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sku_lines TO authenticated;
GRANT ALL ON public.sku_lines TO service_role;
ALTER TABLE public.sku_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sku read" ON public.sku_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "sku write" ON public.sku_lines FOR ALL TO authenticated USING (public.can_edit_deal()) WITH CHECK (public.can_edit_deal());
CREATE TRIGGER sku_lines_updated BEFORE UPDATE ON public.sku_lines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Generic per-scenario model configs
CREATE TABLE public.scenario_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  model_key text NOT NULL,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scenario_id, model_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scenario_models TO authenticated;
GRANT ALL ON public.scenario_models TO service_role;
ALTER TABLE public.scenario_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "models read" ON public.scenario_models FOR SELECT TO authenticated USING (true);
CREATE POLICY "models write" ON public.scenario_models FOR ALL TO authenticated USING (public.can_edit_deal()) WITH CHECK (public.can_edit_deal());
CREATE TRIGGER scenario_models_updated BEFORE UPDATE ON public.scenario_models FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Discussion items
CREATE TABLE public.discussion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  area text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Open',
  owner text,
  commercial_impact text,
  technical_impact text,
  decision_needed text,
  target_decision_date date,
  order_form_inclusion text NOT NULL DEFAULT 'defer',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discussion_items TO authenticated;
GRANT ALL ON public.discussion_items TO service_role;
ALTER TABLE public.discussion_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discussion read" ON public.discussion_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "discussion write" ON public.discussion_items FOR ALL TO authenticated USING (public.can_edit_deal()) WITH CHECK (public.can_edit_deal());
CREATE TRIGGER discussion_updated BEFORE UPDATE ON public.discussion_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Bulk discount tiers
CREATE TABLE public.bulk_discount_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  tier_name text NOT NULL,
  tcv_threshold numeric NOT NULL DEFAULT 0,
  discount_pct numeric NOT NULL DEFAULT 0,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bulk_discount_tiers TO authenticated;
GRANT ALL ON public.bulk_discount_tiers TO service_role;
ALTER TABLE public.bulk_discount_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tiers read" ON public.bulk_discount_tiers FOR SELECT TO authenticated USING (true);
CREATE POLICY "tiers write" ON public.bulk_discount_tiers FOR ALL TO authenticated USING (public.can_edit_deal()) WITH CHECK (public.can_edit_deal());
CREATE TRIGGER tiers_updated BEFORE UPDATE ON public.bulk_discount_tiers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Order forms
CREATE TABLE public.order_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid NOT NULL REFERENCES public.scenarios(id) ON DELETE CASCADE,
  form_type text NOT NULL,
  form_number text,
  customer_name text NOT NULL DEFAULT 'Smith+Nephew',
  partner_name text NOT NULL DEFAULT 'Salesforce',
  contract_start date,
  contract_end date,
  billing_frequency text NOT NULL DEFAULT 'Annual',
  currency text NOT NULL DEFAULT 'USD',
  notes text,
  assumptions text,
  open_items text,
  approval_status text NOT NULL DEFAULT 'Draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_forms TO authenticated;
GRANT ALL ON public.order_forms TO service_role;
ALTER TABLE public.order_forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "of read" ON public.order_forms FOR SELECT TO authenticated USING (true);
CREATE POLICY "of write" ON public.order_forms FOR ALL TO authenticated USING (public.can_edit_deal()) WITH CHECK (public.can_edit_deal());
CREATE TRIGGER of_updated BEFORE UPDATE ON public.order_forms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.order_form_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_form_id uuid NOT NULL REFERENCES public.order_forms(id) ON DELETE CASCADE,
  sku_line_id uuid REFERENCES public.sku_lines(id) ON DELETE SET NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.order_form_lines TO authenticated;
GRANT ALL ON public.order_form_lines TO service_role;
ALTER TABLE public.order_form_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ofl read" ON public.order_form_lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "ofl write" ON public.order_form_lines FOR ALL TO authenticated USING (public.can_edit_deal()) WITH CHECK (public.can_edit_deal());

-- Risk log
CREATE TABLE public.risk_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text,
  category text NOT NULL,
  description text NOT NULL,
  owner text,
  impact text NOT NULL DEFAULT 'Medium',
  probability text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Open',
  decision_needed_by date,
  commercial_impact text,
  technical_impact text,
  legal_impact text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_log TO authenticated;
GRANT ALL ON public.risk_log TO service_role;
ALTER TABLE public.risk_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "risk read" ON public.risk_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "risk write" ON public.risk_log FOR ALL TO authenticated USING (public.can_edit_deal()) WITH CHECK (public.can_edit_deal());
CREATE TRIGGER risk_updated BEFORE UPDATE ON public.risk_log FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Import batches
CREATE TABLE public.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id uuid REFERENCES public.scenarios(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  tab_names text[] NOT NULL DEFAULT '{}',
  row_count int NOT NULL DEFAULT 0,
  mapping jsonb NOT NULL DEFAULT '{}'::jsonb,
  validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'uploaded',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_batches TO authenticated;
GRANT ALL ON public.import_batches TO service_role;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "imports read" ON public.import_batches FOR SELECT TO authenticated USING (true);
CREATE POLICY "imports write" ON public.import_batches FOR ALL TO authenticated USING (public.can_edit_deal()) WITH CHECK (public.can_edit_deal());
CREATE TRIGGER imports_updated BEFORE UPDATE ON public.import_batches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();