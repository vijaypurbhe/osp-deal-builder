DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'app_role' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('login_report_admin');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.login_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  logged_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_agent TEXT,
  ip_address TEXT,
  location TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.login_audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_login_audit_log_user_id ON public.login_audit_log (user_id);
CREATE INDEX IF NOT EXISTS idx_login_audit_log_logged_in_at ON public.login_audit_log (logged_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_audit_log_email ON public.login_audit_log (email);

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

CREATE OR REPLACE FUNCTION public.is_techmahindra_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT public.current_user_email() LIKE '%@techmahindra.com';
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.ensure_login_report_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  IF public.current_user_email() = 'vijay.purbhe@techmahindra.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'login_report_admin')
    ON CONFLICT (user_id, role) DO NOTHING;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'login_report_admin'));

DROP POLICY IF EXISTS "Users can insert their own login audit rows" ON public.login_audit_log;
CREATE POLICY "Users can insert their own login audit rows"
ON public.login_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND public.is_techmahindra_user()
  AND lower(email) = public.current_user_email()
);

DROP POLICY IF EXISTS "Users can view allowed login audit rows" ON public.login_audit_log;
CREATE POLICY "Users can view allowed login audit rows"
ON public.login_audit_log
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'login_report_admin'));

REVOKE ALL ON public.user_roles FROM anon;
REVOKE ALL ON public.login_audit_log FROM anon;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT ON public.login_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_techmahindra_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_login_report_admin() TO authenticated;