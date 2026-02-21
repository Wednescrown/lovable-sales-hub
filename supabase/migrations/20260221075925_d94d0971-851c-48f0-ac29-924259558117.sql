
CREATE OR REPLACE FUNCTION public.check_has_pin(_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (pin IS NOT NULL) FROM public.profiles WHERE id = _profile_id LIMIT 1
$$;
