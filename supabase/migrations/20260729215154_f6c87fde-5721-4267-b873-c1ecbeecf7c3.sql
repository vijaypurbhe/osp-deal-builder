REVOKE EXECUTE ON FUNCTION public.can_edit_deal() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_deal_architect() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ensure_login_report_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_edit_deal() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_deal_architect() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_login_report_admin() TO authenticated;