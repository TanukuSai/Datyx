CREATE OR REPLACE FUNCTION public.get_auth_users_without_profiles()
RETURNS TABLE (
  id uuid,
  email text,
  created_at timestamptz
)
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  RETURN QUERY
  SELECT u.id, u.email::text, u.created_at
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  WHERE p.id IS NULL
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql;
