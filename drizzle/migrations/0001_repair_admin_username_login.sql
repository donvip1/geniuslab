CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.email
  FROM public.admin_credentials AS ac
  JOIN auth.users AS u ON u.id = ac.user_id
  WHERE lower(ac.username) = lower(btrim(p_username))
  UNION ALL
  SELECT p.email
  FROM public.profiles AS p
  WHERE lower(p.username) = lower(btrim(p_username))
    AND NOT EXISTS (
      SELECT 1
      FROM public.admin_credentials AS ac
      WHERE lower(ac.username) = lower(btrim(p_username))
    )
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_email_by_username(text) TO anon, authenticated, service_role;