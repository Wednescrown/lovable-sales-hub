
-- Add pin column to profiles (may have been missed in partial rollback)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin TEXT;

-- Function to set a user's PIN (hashed)
CREATE OR REPLACE FUNCTION public.set_user_pin(_profile_id UUID, _pin TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET pin = extensions.crypt(_pin, extensions.gen_salt('bf'))
  WHERE id = _profile_id;
END;
$$;

-- Function to validate a user's PIN
CREATE OR REPLACE FUNCTION public.validate_user_pin(_profile_id UUID, _pin TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT (p.pin IS NOT NULL AND p.pin = extensions.crypt(_pin, p.pin))
  INTO result
  FROM public.profiles p
  WHERE p.id = _profile_id;
  
  RETURN COALESCE(result, false);
END;
$$;
