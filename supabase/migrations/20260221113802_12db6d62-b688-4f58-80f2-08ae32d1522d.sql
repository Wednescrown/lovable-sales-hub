
-- =====================================================
-- SUPER ADMIN & SUBSCRIPTION PLANS - MULTI-TENANT
-- =====================================================

-- 1. Platform Admins table (super admins that manage the entire platform)
CREATE TABLE public.platform_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;

-- Only platform admins can see/manage this table
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id
  )
$$;

CREATE POLICY "Platform admins can view" ON public.platform_admins
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can insert" ON public.platform_admins
  FOR INSERT TO authenticated
  WITH CHECK (public.is_platform_admin(auth.uid()));

CREATE POLICY "Platform admins can delete" ON public.platform_admins
  FOR DELETE TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- 2. Subscription Plans
CREATE TYPE public.plan_interval AS ENUM ('monthly', 'yearly');

CREATE TABLE public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0,
  interval plan_interval NOT NULL DEFAULT 'monthly',
  max_users integer NOT NULL DEFAULT 5,
  max_branches integer NOT NULL DEFAULT 1,
  max_products integer NOT NULL DEFAULT 100,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Plans are readable by everyone (for pricing page), manageable by platform admins
CREATE POLICY "Anyone can view active plans" ON public.subscription_plans
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Platform admins can manage plans" ON public.subscription_plans
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- 3. Company Subscriptions
CREATE TYPE public.subscription_status AS ENUM ('active', 'suspended', 'cancelled', 'expired', 'trial');

CREATE TABLE public.company_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status subscription_status NOT NULL DEFAULT 'trial',
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  suspended_at timestamptz,
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

ALTER TABLE public.company_subscriptions ENABLE ROW LEVEL SECURITY;

-- Company users can see their own subscription
CREATE POLICY "Users can view own company subscription" ON public.company_subscriptions
  FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- Platform admins can manage all subscriptions
CREATE POLICY "Platform admins can manage subscriptions" ON public.company_subscriptions
  FOR ALL TO authenticated
  USING (public.is_platform_admin(auth.uid()));

-- 4. Insert the 3 default plans
INSERT INTO public.subscription_plans (name, description, price, interval, max_users, max_branches, max_products, features, sort_order) VALUES
  ('Básico', 'Ideal para pequenos negócios com uma única loja.', 9900, 'monthly', 3, 1, 200, '["POS básico", "Gestão de produtos", "Relatórios simples", "1 Filial"]'::jsonb, 1),
  ('Profissional', 'Para negócios em crescimento com múltiplas filiais.', 24900, 'monthly', 10, 3, 1000, '["Tudo do Básico", "Múltiplas filiais", "Gestão de compras", "Relatórios avançados", "Gestão de utilizadores"]'::jsonb, 2),
  ('Empresarial', 'Para grandes empresas com necessidades avançadas.', 49900, 'monthly', 50, 10, 10000, '["Tudo do Profissional", "Filiais ilimitadas*", "API de integração", "Suporte prioritário", "Personalização"]'::jsonb, 3);

-- 5. Triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_company_subscriptions_updated_at
  BEFORE UPDATE ON public.company_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
