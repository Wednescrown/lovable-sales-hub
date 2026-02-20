-- Fix: Insert the company that failed to register and link it
DO $$
DECLARE
  _cid UUID;
BEGIN
  INSERT INTO public.companies (name, email)
  VALUES ('Juliao Luanda', 'wednescrown@gmail.com')
  RETURNING id INTO _cid;

  UPDATE public.profiles
  SET company_id = _cid
  WHERE user_id = 'a4330dc1-42a6-4971-a1dd-067bf2079363';

  UPDATE public.user_roles
  SET role = 'admin'
  WHERE user_id = 'a4330dc1-42a6-4971-a1dd-067bf2079363';
END;
$$;