DROP POLICY IF EXISTS "architects manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "architects delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "roles readable by signed in" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "roles readable by self or admin" ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.is_osp_admin() OR public.has_role(auth.uid(), 'login_report_admin'::app_role));
CREATE POLICY "admins insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_osp_admin());
CREATE POLICY "admins delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_osp_admin());

DROP POLICY IF EXISTS "profiles readable by signed in" ON public.profiles;
CREATE POLICY "profiles readable by self or admin" ON public.profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_osp_admin());