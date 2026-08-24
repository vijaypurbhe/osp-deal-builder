DROP POLICY IF EXISTS "deals read" ON public.deals;
CREATE POLICY "deals read" ON public.deals
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      owner_id = auth.uid()
      OR public.is_osp_admin()
      OR (is_simulation AND owner_id IS NULL)
      OR public.deal_member_role(id) IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "deals update" ON public.deals;
CREATE POLICY "deals update" ON public.deals
  FOR UPDATE TO authenticated
  USING (
    auth.uid() IS NOT NULL AND (
      owner_id = auth.uid()
      OR public.is_osp_admin()
      OR public.deal_member_role(id) = 'editor'
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      owner_id = auth.uid()
      OR public.is_osp_admin()
      OR public.deal_member_role(id) = 'editor'
    )
  );

DROP POLICY IF EXISTS "deals delete" ON public.deals;
CREATE POLICY "deals delete" ON public.deals
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL AND (owner_id = auth.uid() OR public.is_osp_admin()));