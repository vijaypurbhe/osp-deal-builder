INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'deal_architect'::app_role FROM auth.users u
ON CONFLICT (user_id, role) DO NOTHING;

CREATE OR REPLACE FUNCTION public.grant_default_deal_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'deal_architect'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_deal_role ON auth.users;
CREATE TRIGGER on_auth_user_created_deal_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_default_deal_role();