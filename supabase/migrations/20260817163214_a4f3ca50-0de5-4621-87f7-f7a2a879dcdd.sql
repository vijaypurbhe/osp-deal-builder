-- 1. Customers
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text,
  sub_industry text,
  region text,
  country text,
  currency text NOT NULL DEFAULT 'USD',
  employee_count integer,
  annual_revenue numeric,
  salesforce_customer_since text,
  current_salesforce_acv numeric NOT NULL DEFAULT 0,
  aws_customer boolean NOT NULL DEFAULT false,
  aws_commitment numeric NOT NULL DEFAULT 0,
  azure_commitment numeric NOT NULL DEFAULT 0,
  gcp_commitment numeric NOT NULL DEFAULT 0,
  strategic_platforms text[] NOT NULL DEFAULT '{}'::text[],
  incumbent_vendors text[] NOT NULL DEFAULT '{}'::text[],
  logo_url text,
  brand_primary text,
  brand_secondary text,
  notes text,
  is_simulation boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers read" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "customers write" ON public.customers FOR ALL TO authenticated USING (can_edit_deal()) WITH CHECK (can_edit_deal());
CREATE TRIGGER customers_updated BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Deal extensions
ALTER TABLE public.deals
  ADD COLUMN customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  ADD COLUMN opportunity_id text,
  ADD COLUMN deal_type text NOT NULL DEFAULT 'Renewal + Growth',
  ADD COLUMN stage text NOT NULL DEFAULT 'Simulation',
  ADD COLUMN region text,
  ADD COLUMN contract_years numeric NOT NULL DEFAULT 3,
  ADD COLUMN close_date date,
  ADD COLUMN salesforce_ae text,
  ADD COLUMN techm_account_lead text,
  ADD COLUMN techm_osp_lead text,
  ADD COLUMN finance_owner text,
  ADD COLUMN source_deal_id uuid,
  ADD COLUMN is_simulation boolean NOT NULL DEFAULT false,
  ADD COLUMN current_scenario_id uuid,
  ADD COLUMN current_salesforce_acv numeric NOT NULL DEFAULT 0,
  ADD COLUMN renewal_uplift_pct numeric NOT NULL DEFAULT 5,
  ADD COLUMN min_license_gm_pct numeric NOT NULL DEFAULT 5,
  ADD COLUMN services_gm_target_pct numeric NOT NULL DEFAULT 25,
  ADD COLUMN use_customer_branding boolean NOT NULL DEFAULT false;
CREATE INDEX deals_customer_idx ON public.deals(customer_id);

-- 3. SKU line economics + commercial layer
ALTER TABLE public.sku_lines
  ADD COLUMN commercial_layer text NOT NULL DEFAULT 'A',
  ADD COLUMN edition text,
  ADD COLUMN metric text,
  ADD COLUMN growth_category text,
  ADD COLUMN acquisition_unit_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN current_contract_unit_price numeric NOT NULL DEFAULT 0;

ALTER TABLE public.sku_library
  ADD COLUMN edition text,
  ADD COLUMN metric text,
  ADD COLUMN billing_unit text,
  ADD COLUMN wholesale_unit_price numeric NOT NULL DEFAULT 0,
  ADD COLUMN default_commercial_layer text NOT NULL DEFAULT 'A';

-- 4. Services construct
CREATE TABLE public.services_constructs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Managed services construct',
  scope text,
  annual_fee numeric NOT NULL DEFAULT 0,
  annual_cost numeric NOT NULL DEFAULT 0,
  years numeric NOT NULL DEFAULT 3,
  implementation_fee numeric NOT NULL DEFAULT 0,
  implementation_cost numeric NOT NULL DEFAULT 0,
  attach_target_pct numeric NOT NULL DEFAULT 25,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services_constructs TO authenticated;
GRANT ALL ON public.services_constructs TO service_role;
ALTER TABLE public.services_constructs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services read" ON public.services_constructs FOR SELECT TO authenticated USING (true);
CREATE POLICY "services write" ON public.services_constructs FOR ALL TO authenticated USING (can_edit_deal()) WITH CHECK (can_edit_deal());
CREATE TRIGGER services_updated BEFORE UPDATE ON public.services_constructs FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Transformation Innovation Fund
CREATE TABLE public.innovation_funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Transformation Innovation Fund',
  template text NOT NULL DEFAULT 'Balanced Fund',
  total_fund numeric NOT NULL DEFAULT 0,
  salesforce_funded numeric NOT NULL DEFAULT 0,
  techm_funded numeric NOT NULL DEFAULT 0,
  customer_funded numeric NOT NULL DEFAULT 0,
  drawdown_y1 numeric NOT NULL DEFAULT 0,
  drawdown_y2 numeric NOT NULL DEFAULT 0,
  drawdown_y3 numeric NOT NULL DEFAULT 0,
  consumed numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Proposed',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.innovation_funds TO authenticated;
GRANT ALL ON public.innovation_funds TO service_role;
ALTER TABLE public.innovation_funds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tif read" ON public.innovation_funds FOR SELECT TO authenticated USING (true);
CREATE POLICY "tif write" ON public.innovation_funds FOR ALL TO authenticated USING (can_edit_deal()) WITH CHECK (can_edit_deal());
CREATE TRIGGER tif_updated BEFORE UPDATE ON public.innovation_funds FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Competitive displacement
CREATE TABLE public.incumbent_platforms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  vendor text NOT NULL,
  product text,
  annual_license_spend numeric NOT NULL DEFAULT 0,
  annual_services_spend numeric NOT NULL DEFAULT 0,
  users numeric NOT NULL DEFAULT 0,
  renewal_date date,
  contract_end_date date,
  notes text,
  replacement_salesforce_product text,
  replacement_users numeric NOT NULL DEFAULT 0,
  replacement_annual_license_cost numeric NOT NULL DEFAULT 0,
  replacement_implementation_cost numeric NOT NULL DEFAULT 0,
  replacement_managed_services_cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Opportunity',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incumbent_platforms TO authenticated;
GRANT ALL ON public.incumbent_platforms TO service_role;
ALTER TABLE public.incumbent_platforms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "incumbent read" ON public.incumbent_platforms FOR SELECT TO authenticated USING (true);
CREATE POLICY "incumbent write" ON public.incumbent_platforms FOR ALL TO authenticated USING (can_edit_deal()) WITH CHECK (can_edit_deal());
CREATE TRIGGER incumbent_updated BEFORE UPDATE ON public.incumbent_platforms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Cloud marketplace
CREATE TABLE public.marketplace_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'AWS',
  route text NOT NULL DEFAULT 'Marketplace private offer',
  is_enabled boolean NOT NULL DEFAULT false,
  commitment_total numeric NOT NULL DEFAULT 0,
  commitment_remaining numeric NOT NULL DEFAULT 0,
  drawdown_pct numeric NOT NULL DEFAULT 100,
  marketplace_fee_pct numeric NOT NULL DEFAULT 3,
  cppo boolean NOT NULL DEFAULT false,
  eligibility_status text NOT NULL DEFAULT 'Pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_models TO authenticated;
GRANT ALL ON public.marketplace_models TO service_role;
ALTER TABLE public.marketplace_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt read" ON public.marketplace_models FOR SELECT TO authenticated USING (true);
CREATE POLICY "mkt write" ON public.marketplace_models FOR ALL TO authenticated USING (can_edit_deal()) WITH CHECK (can_edit_deal());
CREATE TRIGGER mkt_updated BEFORE UPDATE ON public.marketplace_models FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Versions
CREATE TABLE public.deal_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  version_no integer NOT NULL DEFAULT 1,
  label text NOT NULL,
  summary text,
  snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  author_id uuid,
  author_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_versions TO authenticated;
GRANT ALL ON public.deal_versions TO service_role;
ALTER TABLE public.deal_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "versions read" ON public.deal_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "versions write" ON public.deal_versions FOR ALL TO authenticated USING (can_edit_deal()) WITH CHECK (can_edit_deal());

-- 9. Validation items
CREATE TABLE public.validation_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'universal',
  check_key text,
  title text NOT NULL,
  detail text,
  severity text NOT NULL DEFAULT 'Medium',
  status text NOT NULL DEFAULT 'Open',
  owner text,
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.validation_items TO authenticated;
GRANT ALL ON public.validation_items TO service_role;
ALTER TABLE public.validation_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "validation read" ON public.validation_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "validation write" ON public.validation_items FOR ALL TO authenticated USING (can_edit_deal()) WITH CHECK (can_edit_deal());
CREATE TRIGGER validation_updated BEFORE UPDATE ON public.validation_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10. Customer value levers
CREATE TABLE public.value_levers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  category text NOT NULL,
  description text,
  annual_value numeric NOT NULL DEFAULT 0,
  term_value numeric NOT NULL DEFAULT 0,
  is_included boolean NOT NULL DEFAULT true,
  confidence text NOT NULL DEFAULT 'Medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.value_levers TO authenticated;
GRANT ALL ON public.value_levers TO service_role;
ALTER TABLE public.value_levers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "levers read" ON public.value_levers FOR SELECT TO authenticated USING (true);
CREATE POLICY "levers write" ON public.value_levers FOR ALL TO authenticated USING (can_edit_deal()) WITH CHECK (can_edit_deal());
CREATE TRIGGER levers_updated BEFORE UPDATE ON public.value_levers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 11. Deal templates
CREATE TABLE public.deal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  deal_type text NOT NULL DEFAULT 'Renewal + Growth',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_deal_id uuid,
  is_seed boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_templates TO authenticated;
GRANT ALL ON public.deal_templates TO service_role;
ALTER TABLE public.deal_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates read" ON public.deal_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates write" ON public.deal_templates FOR ALL TO authenticated USING (can_edit_deal()) WITH CHECK (can_edit_deal());
CREATE TRIGGER templates_updated BEFORE UPDATE ON public.deal_templates FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 12. Global defaults (admin, single row)
CREATE TABLE public.global_defaults (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active boolean NOT NULL DEFAULT true,
  contract_years numeric NOT NULL DEFAULT 3,
  renewal_uplift_pct numeric NOT NULL DEFAULT 5,
  min_license_gm_pct numeric NOT NULL DEFAULT 5,
  services_gm_target_pct numeric NOT NULL DEFAULT 25,
  services_attach_pct numeric NOT NULL DEFAULT 25,
  currency text NOT NULL DEFAULT 'USD',
  approval_threshold_pct numeric NOT NULL DEFAULT 40,
  marketplace_fee_pct numeric NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.global_defaults TO authenticated;
GRANT ALL ON public.global_defaults TO service_role;
ALTER TABLE public.global_defaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "defaults read" ON public.global_defaults FOR SELECT TO authenticated USING (true);
CREATE POLICY "defaults write" ON public.global_defaults FOR ALL TO authenticated USING (is_deal_architect()) WITH CHECK (is_deal_architect());
CREATE TRIGGER defaults_updated BEFORE UPDATE ON public.global_defaults FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
INSERT INTO public.global_defaults (is_active) VALUES (true);

-- 13. Backfill Smith+Nephew as customer #1 and re-parent the existing deal
INSERT INTO public.customers (id, name, industry, sub_industry, region, country, currency, employee_count, annual_revenue,
  salesforce_customer_since, current_salesforce_acv, aws_customer, aws_commitment, strategic_platforms, incumbent_vendors, notes)
VALUES ('11111111-1111-4111-8111-111111111111', 'Smith+Nephew', 'Life Sciences & Healthcare', 'Medical Devices',
  'Global', 'United Kingdom', 'USD', 18000, 5800000000, '2016', 6260000, true, 25000000,
  ARRAY['Salesforce','AWS','SAP'], ARRAY['PROS','ServiceMax'],
  'Reference customer: FY27 Salesforce OSP renewal and transformation.');

UPDATE public.deals SET
  customer_id = '11111111-1111-4111-8111-111111111111',
  name = 'FY27 Salesforce OSP Renewal & Transformation',
  opportunity_id = 'OPP-SN-FY27-001',
  deal_type = 'Renewal + Growth',
  stage = 'Commercial Design',
  region = 'Global',
  contract_years = 3,
  close_date = '2026-09-30',
  salesforce_ae = 'Salesforce Account Executive',
  techm_account_lead = 'Tech Mahindra Account Lead',
  techm_osp_lead = 'Tech Mahindra OSP Lead',
  finance_owner = 'Tech Mahindra Deal Desk',
  is_simulation = false,
  current_salesforce_acv = 6260000,
  renewal_uplift_pct = 5,
  min_license_gm_pct = 5,
  services_gm_target_pct = 25
WHERE id = 'f949eb0f-ba06-4359-87bb-1ebafd08ac5c';

-- S+N deal data: services, TIF, displacement, marketplace, validation, value levers
INSERT INTO public.services_constructs (deal_id, name, scope, annual_fee, annual_cost, years, attach_target_pct, notes)
VALUES ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 'AMS + transformation services', 'Managed services, licence governance and transformation delivery',
  2000000, 1500000, 3, 25, 'USD 2M per year at a 25% services gross margin.');

INSERT INTO public.innovation_funds (deal_id, template, total_fund, salesforce_funded, techm_funded, drawdown_y1, drawdown_y2, drawdown_y3, status, notes)
VALUES ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 'Balanced Fund', 1500000, 900000, 600000, 500000, 500000, 500000, 'Proposed',
  'Three-year flexible drawdown against the Salesforce commitment.');

INSERT INTO public.incumbent_platforms (deal_id, vendor, product, annual_license_spend, users, replacement_salesforce_product,
  replacement_users, replacement_annual_license_cost, replacement_implementation_cost, replacement_managed_services_cost, status, notes)
VALUES
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 'PROS', 'PROS pricing & CPQ', 2500000, 1100, 'Revenue Cloud Advanced', 1100, 1650000, 1200000, 400000, 'Opportunity', 'PROS annual spend USD 2.5M across 1,100 CPQ users.'),
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 'ServiceMax', 'ServiceMax field service', 900000, 300, 'Salesforce Field Service', 300, 540000, 750000, 250000, 'Opportunity', '300-user field service consolidation opportunity.');

INSERT INTO public.marketplace_models (deal_id, provider, route, is_enabled, commitment_total, commitment_remaining, drawdown_pct, marketplace_fee_pct, cppo, eligibility_status, notes)
VALUES ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 'AWS', 'Marketplace private offer (CPPO)', true, 25000000, 18000000, 100, 3, true, 'Pending',
  'Route OSP licences through AWS Marketplace to draw down the existing EDP commitment.');

INSERT INTO public.validation_items (deal_id, scope, title, detail, severity, status, owner) VALUES
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 'customer', 'Partial Copy sandbox entitlement', 'Confirm whether the Partial Copy sandbox is included in the current contract.', 'Medium', 'Open', 'Salesforce'),
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 'customer', 'Agentforce quantity 1,000 vs 4,557', 'Quoted Agentforce quantity does not reconcile with the eligible population.', 'High', 'Open', 'Salesforce'),
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 'customer', 'Digital / Data 360 line clarification', 'Clarify the Digital and Data 360 SKU construct and unit basis.', 'High', 'Open', 'Salesforce'),
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 'customer', 'Shield entitlement validation', 'Validate Shield requirement alongside the Partial Copy sandbox decision.', 'Medium', 'Open', 'Tech Mahindra');

INSERT INTO public.value_levers (deal_id, category, description, annual_value, term_value) VALUES
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 'Avoided renewal uplift', 'Renewal uplift held at 5% against the protected USD 6M incumbent base.', 313000, 939000),
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 'Platform displacement', 'PROS displaced by Revenue Cloud Advanced.', 850000, 2550000),
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 'Innovation Fund', 'Transformation Innovation Fund available for future scope.', 500000, 1500000),
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 'AWS commitment optimization', 'OSP routed through AWS Marketplace to consume committed spend.', 0, 0);

INSERT INTO public.deal_versions (deal_id, version_no, label, summary, author_name) VALUES
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 1, 'v1 — Initial Salesforce BOM', 'Normalized current bill of materials loaded from the Salesforce extract.', 'Tech Mahindra OSP Lead'),
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 2, 'v2 — USD 6M incumbent structure', 'Protected incumbent estate fixed at USD 6M.', 'Tech Mahindra OSP Lead'),
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 3, 'v3 — Growth separated', 'Known growth separated from the protected base.', 'Tech Mahindra OSP Lead'),
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 4, 'v4 — Innovation Fund added', 'Balanced Transformation Innovation Fund introduced.', 'Tech Mahindra OSP Lead'),
  ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', 5, 'v5 — AWS Marketplace scenario', 'Marketplace routing modelled against the AWS commitment.', 'Tech Mahindra OSP Lead');

-- 14. Demo customer + simulation deal
INSERT INTO public.customers (id, name, industry, sub_industry, region, country, currency, employee_count, annual_revenue,
  current_salesforce_acv, aws_customer, strategic_platforms, incumbent_vendors, notes, is_simulation)
VALUES ('22222222-2222-4222-8222-222222222222', 'Demo Manufacturing Company', 'Manufacturing', 'Industrial Equipment',
  'North America', 'United States', 'USD', 6500, 1200000000, 1800000, false,
  ARRAY['Salesforce'], ARRAY['Microsoft Dynamics'], 'Sample customer used to demonstrate a non-reference deal.', true);

INSERT INTO public.deals (id, name, customer_id, customer_name, partner_name, currency, contract_start, contract_end, status,
  deal_type, stage, region, contract_years, close_date, opportunity_id, is_simulation, current_salesforce_acv, sort_order, notes)
VALUES ('33333333-3333-4333-8333-333333333333', 'New OSP Simulation', '22222222-2222-4222-8222-222222222222',
  'Demo Manufacturing Company', 'Salesforce', 'USD', '2026-04-01', '2029-03-31', 'Shaping',
  'Net New', 'Simulation', 'North America', 3, '2026-12-31', NULL, true, 1800000, 1,
  'Generic sample simulation demonstrating that the platform is not Smith+Nephew specific.');

INSERT INTO public.towers (deal_id, key, name, description, sort_order) VALUES
  ('33333333-3333-4333-8333-333333333333', 'core', 'Core Commercial Platform', 'Sales and Service Cloud core estate', 1),
  ('33333333-3333-4333-8333-333333333333', 'data_ai', 'Data, Analytics & AI', 'Data 360 and Agentforce', 2);

INSERT INTO public.scenarios (id, deal_id, name, description, is_baseline, is_recommended, is_locked, scenario_discount_pct, bulk_discount_pct, strategic_override_pct, sort_order)
VALUES
  ('44444444-4444-4444-8444-444444444444', '33333333-3333-4333-8333-333333333333', 'Current BOM Baseline', 'Sample baseline estate', true, false, true, 0, 0, 0, 0),
  ('55555555-5555-4555-8555-555555555555', '33333333-3333-4333-8333-333333333333', 'Expected Landing Zone', 'Sample expected commercial landing point', false, true, false, 12, 6, 2, 1);

INSERT INTO public.sku_lines (scenario_id, tower_key, sku_name, sku_code, product_family, classification, commercial_layer, quantity, unit_of_measure, unit_list_price, acquisition_unit_price)
SELECT s.id, v.tower, v.sku_name, v.sku_code, v.family, v.classification, v.layer, v.qty, 'User', v.price, v.acq
FROM (VALUES ('44444444-4444-4444-8444-444444444444'::uuid), ('55555555-5555-4555-8555-555555555555'::uuid)) AS sc(id)
JOIN public.scenarios s ON s.id = sc.id
CROSS JOIN (VALUES
  ('core', 'Sales Cloud Enterprise', 'SC-ENT', 'Sales Cloud', 'Current baseline', 'A', 900, 4500, 4050),
  ('core', 'Service Cloud Enterprise', 'SVC-ENT', 'Service Cloud', 'Current baseline', 'A', 600, 4500, 4050),
  ('data_ai', 'Agentforce Service Agent', 'AF-SVC', 'Agentforce', 'Growth', 'B', 250, 5400, 4700),
  ('data_ai', 'Data 360 Credits', 'D360-CR', 'Data 360', 'Growth', 'C', 120, 3000, 2600)
) AS v(tower, sku_name, sku_code, family, classification, layer, qty, price, acq);

INSERT INTO public.services_constructs (deal_id, name, scope, annual_fee, annual_cost, years, attach_target_pct)
VALUES ('33333333-3333-4333-8333-333333333333', 'Implementation + AMS', 'Sample services construct', 750000, 560000, 3, 25);

INSERT INTO public.marketplace_models (deal_id, provider, route, is_enabled, commitment_total, commitment_remaining, eligibility_status)
VALUES ('33333333-3333-4333-8333-333333333333', 'AWS', 'Marketplace private offer', false, 0, 0, 'Not applicable');

-- 15. Deal templates
INSERT INTO public.deal_templates (name, description, deal_type, source_deal_id, is_seed, sort_order, config) VALUES
  ('Enterprise Renewal + Growth', 'Current estate, protected renewal and incremental growth.', 'Renewal + Growth', NULL, true, 1, '{"layers":["A","B"],"services_attach_pct":25}'::jsonb),
  ('Agentforce Transformation', 'CRM base plus Agentforce add-ons, Flex credits and services.', 'Expansion', NULL, true, 2, '{"focus":"Agentforce"}'::jsonb),
  ('Revenue Cloud Displacement', 'Incumbent CPQ displaced by Revenue Cloud Advanced.', 'Competitive Displacement', NULL, true, 3, '{"incumbent":"CPQ"}'::jsonb),
  ('Field Service Consolidation', 'Legacy field service management consolidated onto Salesforce Field Service.', 'Competitive Displacement', NULL, true, 4, '{"incumbent":"FSM"}'::jsonb),
  ('Platform Consolidation', 'Multiple applications replaced by the Salesforce platform.', 'Platform Consolidation', NULL, true, 5, '{}'::jsonb),
  ('AWS Marketplace OSP', 'OSP transaction routed through AWS Marketplace.', 'Marketplace Transaction', NULL, true, 6, '{"provider":"AWS"}'::jsonb),
  ('License + Services Bundle', 'OSP licences bundled with implementation and managed services.', 'Transformation Bundle', NULL, true, 7, '{"services_attach_pct":30}'::jsonb),
  ('Transformation Innovation Fund', 'Three-year commitment with a flexible future drawdown fund.', 'OSP Pre-Buy', NULL, true, 8, '{"tif_template":"Strategic Growth Fund"}'::jsonb),
  ('Smith+Nephew FY27 Deal', 'Fully modelled reference transaction.', 'Renewal + Growth', 'f949eb0f-ba06-4359-87bb-1ebafd08ac5c', true, 9, '{"reference":true}'::jsonb);

-- 16. Universal validation seeds for both deals
INSERT INTO public.validation_items (deal_id, scope, check_key, title, detail, severity)
SELECT d.id, 'universal', v.k, v.t, v.dt, v.sev
FROM public.deals d
CROSS JOIN (VALUES
  ('tcv_reconciliation', 'TCV reconciliation', 'Scenario term value must reconcile with the sum of annual totals.', 'High'),
  ('margin_floor', 'Margin floor', 'Licence gross margin must stay at or above the deal minimum.', 'High'),
  ('coterm', 'Co-terming', 'All lines should co-term with the master agreement end date.', 'Medium'),
  ('quantity_variance', 'Quantity discrepancies', 'Year 1-3 quantities must be explained where they differ from the baseline.', 'Medium')
) AS v(k, t, dt, sev)
WHERE d.id IN ('f949eb0f-ba06-4359-87bb-1ebafd08ac5c', '33333333-3333-4333-8333-333333333333');