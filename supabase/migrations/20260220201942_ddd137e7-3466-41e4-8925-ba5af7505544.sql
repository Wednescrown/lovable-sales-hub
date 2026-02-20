
-- Create companies table (was lost due to partial migration failure)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- FK from profiles (add only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_company_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_company_id_fkey
      FOREIGN KEY (company_id) REFERENCES public.companies(id);
  END IF;
END $$;

-- RLS: anyone authenticated can view own company
CREATE POLICY "Users can view own company"
  ON public.companies FOR SELECT TO authenticated
  USING (id = get_user_company_id(auth.uid()));

-- RLS: any authenticated user can create a company (registration)
CREATE POLICY "Authenticated users can create a company"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (true);

-- RLS: admins can update own company
CREATE POLICY "Admins can update own company"
  ON public.companies FOR UPDATE TO authenticated
  USING (id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- Update profiles UPDATE policy to allow self-update (needed for registration)
DROP POLICY IF EXISTS "Admins can update profiles in same company" ON public.profiles;

CREATE POLICY "Users can update own profile or admins update company profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
  );

-- Allow users to update their own role (needed during registration to set admin)
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;

CREATE POLICY "Admins or self can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR user_id = auth.uid()
  );
