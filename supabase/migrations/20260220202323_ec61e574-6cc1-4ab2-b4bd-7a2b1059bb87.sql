
-- Function to handle full company registration (bypasses RLS)
CREATE OR REPLACE FUNCTION public.register_company(
  _user_id UUID,
  _company_name TEXT,
  _company_email TEXT,
  _company_phone TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _company_id UUID;
BEGIN
  -- Create the company
  INSERT INTO public.companies (name, email, phone)
  VALUES (_company_name, _company_email, _company_phone)
  RETURNING id INTO _company_id;

  -- Link profile to company
  UPDATE public.profiles
  SET company_id = _company_id
  WHERE user_id = _user_id;

  -- Set user role to admin
  UPDATE public.user_roles
  SET role = 'admin'
  WHERE user_id = _user_id;

  RETURN _company_id;
END;
$$;
