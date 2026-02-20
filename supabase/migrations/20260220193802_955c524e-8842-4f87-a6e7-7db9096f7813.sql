
-- Table for custom roles (company-specific)
CREATE TABLE public.custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  label text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, name)
);

-- Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Users in the same company can view custom roles
CREATE POLICY "Users can view company custom roles"
ON public.custom_roles FOR SELECT TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));

-- Only admins can manage custom roles
CREATE POLICY "Admins can insert custom roles"
ON public.custom_roles FOR INSERT TO authenticated
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can update custom roles"
ON public.custom_roles FOR UPDATE TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete custom roles"
ON public.custom_roles FOR DELETE TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin'::app_role)
);

-- Trigger for updated_at
CREATE TRIGGER update_custom_roles_updated_at
BEFORE UPDATE ON public.custom_roles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Permissions for custom roles (mirrors module_permissions but references custom_role_id)
CREATE TABLE public.custom_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  module text NOT NULL,
  can_access boolean NOT NULL DEFAULT false,
  UNIQUE(custom_role_id, module)
);

ALTER TABLE public.custom_role_permissions ENABLE ROW LEVEL SECURITY;

-- View: anyone authenticated in the same company
CREATE POLICY "Users can view custom role permissions"
ON public.custom_role_permissions FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.custom_roles cr
    WHERE cr.id = custom_role_id
      AND cr.company_id = public.get_user_company_id(auth.uid())
  )
);

-- Manage: only admins
CREATE POLICY "Admins can manage custom role permissions"
ON public.custom_role_permissions FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.custom_roles cr
    WHERE cr.id = custom_role_id
      AND cr.company_id = public.get_user_company_id(auth.uid())
      AND public.has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Assignment table: link users to custom roles
CREATE TABLE public.user_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  custom_role_id uuid NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, custom_role_id)
);

ALTER TABLE public.user_custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own custom roles or admins all"
ON public.user_custom_roles FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can manage user custom roles"
ON public.user_custom_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
