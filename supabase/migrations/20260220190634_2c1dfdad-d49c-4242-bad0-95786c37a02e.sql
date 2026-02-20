
-- 1. Enum de cargos
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'caixeiro', 'gestor_stock');

-- 2. Tabela de perfis (dados adicionais do utilizador)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  full_name TEXT NOT NULL,
  display_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Tabela de cargos (separada do perfil por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'caixeiro',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Tabela de histórico de actividade
CREATE TABLE public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- 5. Tabela de permissões por módulo/cargo
CREATE TABLE public.module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  module TEXT NOT NULL,
  can_access BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(role, module)
);

ALTER TABLE public.module_permissions ENABLE ROW LEVEL SECURITY;

-- 6. Security definer function para verificar cargo
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 7. Security definer function para obter company_id do utilizador
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- 8. RLS Policies para profiles
CREATE POLICY "Users can view profiles in same company"
  ON public.profiles FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Admins can update profiles in same company"
  ON public.profiles FOR UPDATE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin')
      OR user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (
    company_id = public.get_user_company_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  );

-- 9. RLS Policies para user_roles
CREATE POLICY "Users can view roles in same company"
  ON public.user_roles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = user_roles.user_id
      AND p.company_id = public.get_user_company_id(auth.uid())
    )
  );

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 10. RLS Policies para activity_log
CREATE POLICY "Users can view activity in same company"
  ON public.activity_log FOR SELECT TO authenticated
  USING (company_id = public.get_user_company_id(auth.uid()));

CREATE POLICY "Authenticated users can insert activity"
  ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- 11. RLS Policies para module_permissions (leitura para todos autenticados)
CREATE POLICY "Anyone can view module permissions"
  ON public.module_permissions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage module permissions"
  ON public.module_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 12. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 13. Trigger para criar perfil automaticamente ao signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  -- Default role: caixeiro
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'caixeiro');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. Seed default module permissions
INSERT INTO public.module_permissions (role, module, can_access) VALUES
  ('admin', 'dashboard', true),
  ('admin', 'pos', true),
  ('admin', 'products', true),
  ('admin', 'categories', true),
  ('admin', 'labels', true),
  ('admin', 'stock_count', true),
  ('admin', 'stock_adjustment', true),
  ('admin', 'finances', true),
  ('admin', 'users', true),
  ('gestor', 'dashboard', true),
  ('gestor', 'pos', false),
  ('gestor', 'products', true),
  ('gestor', 'categories', true),
  ('gestor', 'labels', true),
  ('gestor', 'stock_count', true),
  ('gestor', 'stock_adjustment', true),
  ('gestor', 'finances', true),
  ('gestor', 'users', false),
  ('caixeiro', 'dashboard', false),
  ('caixeiro', 'pos', true),
  ('caixeiro', 'products', false),
  ('caixeiro', 'categories', false),
  ('caixeiro', 'labels', false),
  ('caixeiro', 'stock_count', false),
  ('caixeiro', 'stock_adjustment', false),
  ('caixeiro', 'finances', true),
  ('caixeiro', 'users', false),
  ('gestor_stock', 'dashboard', false),
  ('gestor_stock', 'pos', false),
  ('gestor_stock', 'products', true),
  ('gestor_stock', 'categories', true),
  ('gestor_stock', 'labels', true),
  ('gestor_stock', 'stock_count', true),
  ('gestor_stock', 'stock_adjustment', true),
  ('gestor_stock', 'finances', false),
  ('gestor_stock', 'users', false);
