
-- Branches table
CREATE TABLE public.branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  phone text,
  email text,
  manager_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

-- Policies: users in same company can view
CREATE POLICY "Users can view company branches"
ON public.branches FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

-- Only admins can manage
CREATE POLICY "Admins can insert branches"
ON public.branches FOR INSERT TO authenticated
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update branches"
ON public.branches FOR UPDATE TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete branches"
ON public.branches FOR DELETE TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger for updated_at
CREATE TRIGGER update_branches_updated_at
BEFORE UPDATE ON public.branches
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Add branch_id to profiles (nullable, user may not be assigned yet)
ALTER TABLE public.profiles
ADD COLUMN branch_id uuid REFERENCES public.branches(id) ON DELETE SET NULL;
