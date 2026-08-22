-- 1. Admin seed
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'osp_admin'::app_role FROM auth.users WHERE lower(email) IN ('vijaypralhad.purbhe@techmahindra.com','vijay.purbhe@techmahindra.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Ownership backfill
UPDATE public.deals d SET owner_id = u.id, owner_name = coalesce(d.owner_name, u.email)
FROM auth.users u
WHERE d.owner_id IS NULL AND d.is_simulation = false
  AND lower(u.email) = 'vijaypralhad.purbhe@techmahindra.com';

ALTER TABLE public.deals ALTER COLUMN owner_id SET DEFAULT auth.uid();
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();
UPDATE public.customers SET created_by = (SELECT id FROM auth.users WHERE lower(email)='vijaypralhad.purbhe@techmahindra.com') WHERE created_by IS NULL;

-- 3. Collaborators
CREATE TABLE IF NOT EXISTS public.deal_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id uuid,
  invited_email text NOT NULL,
  role text NOT NULL DEFAULT 'viewer',
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deal_members ADD CONSTRAINT deal_members_role_chk CHECK (role IN ('viewer','editor'));
CREATE UNIQUE INDEX IF NOT EXISTS deal_members_unique ON public.deal_members (deal_id, lower(invited_email));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deal_members TO authenticated;
GRANT ALL ON public.deal_members TO service_role;
ALTER TABLE public.deal_members ENABLE ROW LEVEL SECURITY;

-- 4. Helpers
CREATE OR REPLACE FUNCTION public.is_osp_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'osp_admin'::app_role);
$$;

CREATE OR REPLACE FUNCTION public.deal_member_role(_deal_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.role FROM public.deal_members m
  WHERE m.deal_id = _deal_id
    AND (m.user_id = auth.uid() OR lower(m.invited_email) = public.current_user_email())
  ORDER BY CASE m.role WHEN 'editor' THEN 0 ELSE 1 END
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.can_read_deal(_deal_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = _deal_id
      AND (
        public.is_osp_admin()
        OR d.owner_id = auth.uid()
        OR (d.is_simulation AND d.owner_id IS NULL)
        OR public.deal_member_role(d.id) IS NOT NULL
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_write_deal(_deal_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.deals d
    WHERE d.id = _deal_id
      AND (
        public.is_osp_admin()
        OR d.owner_id = auth.uid()
        OR public.deal_member_role(d.id) = 'editor'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_read_scenario(_scenario_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.scenarios s WHERE s.id = _scenario_id AND public.can_read_deal(s.deal_id));
$$;

CREATE OR REPLACE FUNCTION public.can_write_scenario(_scenario_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.scenarios s WHERE s.id = _scenario_id AND s.is_locked = false AND public.can_write_deal(s.deal_id));
$$;

CREATE OR REPLACE FUNCTION public.can_own_deal(_deal_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.deals d WHERE d.id = _deal_id AND (public.is_osp_admin() OR d.owner_id = auth.uid()));
$$;

-- 5. deal_members policies
CREATE POLICY "members visible to deal readers" ON public.deal_members FOR SELECT TO authenticated
USING (public.can_read_deal(deal_id));
CREATE POLICY "owners manage members" ON public.deal_members FOR ALL TO authenticated
USING (public.can_own_deal(deal_id)) WITH CHECK (public.can_own_deal(deal_id));

-- 6. Deals
DROP POLICY IF EXISTS "deals read" ON public.deals;
DROP POLICY IF EXISTS "deals write" ON public.deals;
CREATE POLICY "deals read" ON public.deals FOR SELECT TO authenticated USING (public.can_read_deal(id));
CREATE POLICY "deals insert" ON public.deals FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() OR public.is_osp_admin());
CREATE POLICY "deals update" ON public.deals FOR UPDATE TO authenticated USING (public.can_write_deal(id)) WITH CHECK (public.can_write_deal(id));
CREATE POLICY "deals delete" ON public.deals FOR DELETE TO authenticated USING (public.can_own_deal(id));

-- 7. Customers
DROP POLICY IF EXISTS "customers read" ON public.customers;
DROP POLICY IF EXISTS "customers write" ON public.customers;
CREATE POLICY "customers read" ON public.customers FOR SELECT TO authenticated USING (
  public.is_osp_admin() OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.deals d WHERE d.customer_id = customers.id AND public.can_read_deal(d.id))
);
CREATE POLICY "customers insert" ON public.customers FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() OR public.is_osp_admin());
CREATE POLICY "customers update" ON public.customers FOR UPDATE TO authenticated USING (
  public.is_osp_admin() OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.deals d WHERE d.customer_id = customers.id AND public.can_write_deal(d.id))
) WITH CHECK (
  public.is_osp_admin() OR created_by = auth.uid()
  OR EXISTS (SELECT 1 FROM public.deals d WHERE d.customer_id = customers.id AND public.can_write_deal(d.id))
);
CREATE POLICY "customers delete" ON public.customers FOR DELETE TO authenticated USING (public.is_osp_admin() OR created_by = auth.uid());

-- 8. Deal-scoped children
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['towers','risk_log','discussion_items','validation_items','services_constructs','innovation_funds','marketplace_models','incumbent_platforms','value_levers','deal_versions','scenarios']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || ' read', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || ' write', t);
    EXECUTE format('DROP POLICY IF EXISTS "deal read" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "deal write" ON public.%I', t);
    EXECUTE format('CREATE POLICY "deal read" ON public.%I FOR SELECT TO authenticated USING (public.can_read_deal(deal_id))', t);
    EXECUTE format('CREATE POLICY "deal write" ON public.%I FOR ALL TO authenticated USING (public.can_write_deal(deal_id)) WITH CHECK (public.can_write_deal(deal_id))', t);
  END LOOP;
END $$;

-- extra legacy policy names
DROP POLICY IF EXISTS "sku read" ON public.sku_lines;
DROP POLICY IF EXISTS "sku write" ON public.sku_lines;
DROP POLICY IF EXISTS "tiers read" ON public.bulk_discount_tiers;
DROP POLICY IF EXISTS "tiers write" ON public.bulk_discount_tiers;

-- 9. Scenario-scoped children
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['sku_lines','bulk_discount_tiers','order_forms','scenario_models','import_batches']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || ' read', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || ' write', t);
    EXECUTE format('DROP POLICY IF EXISTS "scenario read" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "scenario write" ON public.%I', t);
    EXECUTE format('CREATE POLICY "scenario read" ON public.%I FOR SELECT TO authenticated USING (public.can_read_scenario(scenario_id))', t);
    EXECUTE format('CREATE POLICY "scenario write" ON public.%I FOR ALL TO authenticated USING (public.can_write_scenario(scenario_id)) WITH CHECK (public.can_write_scenario(scenario_id))', t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "order_form_lines read" ON public.order_form_lines;
DROP POLICY IF EXISTS "order_form_lines write" ON public.order_form_lines;
DROP POLICY IF EXISTS "of lines read" ON public.order_form_lines;
DROP POLICY IF EXISTS "of lines write" ON public.order_form_lines;
CREATE POLICY "of lines read" ON public.order_form_lines FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.order_forms f WHERE f.id = order_form_id AND public.can_read_scenario(f.scenario_id))
);
CREATE POLICY "of lines write" ON public.order_form_lines FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.order_forms f WHERE f.id = order_form_id AND public.can_write_scenario(f.scenario_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.order_forms f WHERE f.id = order_form_id AND public.can_write_scenario(f.scenario_id))
);

-- 10. Data integrity guards
ALTER TABLE public.sku_lines DROP CONSTRAINT IF EXISTS sku_lines_qty_chk;
ALTER TABLE public.sku_lines ADD CONSTRAINT sku_lines_qty_chk CHECK (quantity >= 0 AND unit_list_price >= 0 AND line_discount_pct BETWEEN 0 AND 100 AND category_discount_pct BETWEEN 0 AND 100);
ALTER TABLE public.scenarios DROP CONSTRAINT IF EXISTS scenarios_pct_chk;
ALTER TABLE public.scenarios ADD CONSTRAINT scenarios_pct_chk CHECK (scenario_discount_pct BETWEEN 0 AND 100 AND bulk_discount_pct BETWEEN 0 AND 100 AND strategic_override_pct BETWEEN 0 AND 100 AND approval_threshold_pct BETWEEN 0 AND 100);
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_dates_chk;
ALTER TABLE public.deals ADD CONSTRAINT deals_dates_chk CHECK (contract_start IS NULL OR contract_end IS NULL OR contract_end > contract_start);
ALTER TABLE public.deals DROP CONSTRAINT IF EXISTS deals_years_chk;
ALTER TABLE public.deals ADD CONSTRAINT deals_years_chk CHECK (contract_years > 0 AND contract_years <= 15);