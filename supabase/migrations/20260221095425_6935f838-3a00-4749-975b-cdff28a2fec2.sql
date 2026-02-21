
-- =============================================================
-- PARTE 1: Função reset_user_pin
-- =============================================================
CREATE OR REPLACE FUNCTION public.reset_user_pin(_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET pin = NULL
  WHERE id = _profile_id;
END;
$$;

-- =============================================================
-- PARTE 2: Tabelas do módulo de Compras e Devoluções
-- =============================================================

-- 1. suppliers
CREATE TABLE public.suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  name text NOT NULL,
  contact_person text,
  email text,
  phone text,
  address text,
  tax_id text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company suppliers" ON public.suppliers FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins/gestors can insert suppliers" ON public.suppliers FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins/gestors can update suppliers" ON public.suppliers FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete suppliers" ON public.suppliers FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. purchase_orders
CREATE TYPE public.purchase_order_status AS ENUM ('draft','sent','partial','received','cancelled');

CREATE TABLE public.purchase_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  branch_id uuid REFERENCES public.branches(id),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  order_number text NOT NULL,
  status public.purchase_order_status NOT NULL DEFAULT 'draft',
  notes text,
  expected_date date,
  total_amount numeric(15,2) NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company purchase orders" ON public.purchase_orders FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert purchase orders" ON public.purchase_orders FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company purchase orders" ON public.purchase_orders FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete purchase orders" ON public.purchase_orders FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. purchase_order_items
CREATE TABLE public.purchase_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  sku text,
  quantity_ordered numeric(12,2) NOT NULL DEFAULT 0,
  quantity_received numeric(12,2) NOT NULL DEFAULT 0,
  unit_cost numeric(15,2) NOT NULL DEFAULT 0,
  total_cost numeric(15,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view purchase order items" ON public.purchase_order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND po.company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Users can insert purchase order items" ON public.purchase_order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND po.company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Users can update purchase order items" ON public.purchase_order_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND po.company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Users can delete purchase order items" ON public.purchase_order_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.purchase_orders po WHERE po.id = purchase_order_items.purchase_order_id AND po.company_id = get_user_company_id(auth.uid())));

-- 4. goods_received_notes
CREATE TYPE public.grn_status AS ENUM ('received','returned','corrected');

CREATE TABLE public.goods_received_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  branch_id uuid REFERENCES public.branches(id),
  supplier_id uuid NOT NULL REFERENCES public.suppliers(id),
  purchase_order_id uuid REFERENCES public.purchase_orders(id),
  grn_number text NOT NULL,
  status public.grn_status NOT NULL DEFAULT 'received',
  notes text,
  total_amount numeric(15,2) NOT NULL DEFAULT 0,
  received_by uuid,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goods_received_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company GRNs" ON public.goods_received_notes FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert GRNs" ON public.goods_received_notes FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company GRNs" ON public.goods_received_notes FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete GRNs" ON public.goods_received_notes FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_grns_updated_at BEFORE UPDATE ON public.goods_received_notes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 5. grn_items
CREATE TABLE public.grn_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_id uuid NOT NULL REFERENCES public.goods_received_notes(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  sku text,
  quantity_received numeric(12,2) NOT NULL DEFAULT 0,
  unit_cost numeric(15,2) NOT NULL DEFAULT 0,
  total_cost numeric(15,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.grn_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view GRN items" ON public.grn_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.goods_received_notes g WHERE g.id = grn_items.grn_id AND g.company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Users can insert GRN items" ON public.grn_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.goods_received_notes g WHERE g.id = grn_items.grn_id AND g.company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Users can update GRN items" ON public.grn_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.goods_received_notes g WHERE g.id = grn_items.grn_id AND g.company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Users can delete GRN items" ON public.grn_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.goods_received_notes g WHERE g.id = grn_items.grn_id AND g.company_id = get_user_company_id(auth.uid())));

-- 6. grn_returns
CREATE TABLE public.grn_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  grn_id uuid NOT NULL REFERENCES public.goods_received_notes(id),
  return_number text NOT NULL,
  reason text,
  total_amount numeric(15,2) NOT NULL DEFAULT 0,
  returned_by uuid,
  returned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.grn_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company GRN returns" ON public.grn_returns FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert GRN returns" ON public.grn_returns FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update GRN returns" ON public.grn_returns FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

-- 7. grn_return_items
CREATE TABLE public.grn_return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grn_return_id uuid NOT NULL REFERENCES public.grn_returns(id) ON DELETE CASCADE,
  grn_item_id uuid NOT NULL REFERENCES public.grn_items(id),
  quantity_returned numeric(12,2) NOT NULL DEFAULT 0,
  unit_cost numeric(15,2) NOT NULL DEFAULT 0,
  total_cost numeric(15,2) NOT NULL DEFAULT 0
);

ALTER TABLE public.grn_return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view GRN return items" ON public.grn_return_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.grn_returns r WHERE r.id = grn_return_items.grn_return_id AND r.company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Users can insert GRN return items" ON public.grn_return_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.grn_returns r WHERE r.id = grn_return_items.grn_return_id AND r.company_id = get_user_company_id(auth.uid())));

-- =============================================================
-- FUNÇÕES AUXILIARES
-- =============================================================

-- Gera número sequencial para purchase orders
CREATE OR REPLACE FUNCTION public.generate_next_order_number(_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 'OC-(\d+)') AS integer)), 0) + 1
  INTO next_num
  FROM public.purchase_orders
  WHERE company_id = _company_id;
  RETURN 'OC-' || LPAD(next_num::text, 4, '0');
END;
$$;

-- Gera número sequencial para GRNs
CREATE OR REPLACE FUNCTION public.generate_next_grn_number(_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(grn_number FROM 'GRN-(\d+)') AS integer)), 0) + 1
  INTO next_num
  FROM public.goods_received_notes
  WHERE company_id = _company_id;
  RETURN 'GRN-' || LPAD(next_num::text, 4, '0');
END;
$$;

-- Gera número sequencial para devoluções
CREATE OR REPLACE FUNCTION public.generate_next_return_number(_company_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(return_number FROM 'DEV-(\d+)') AS integer)), 0) + 1
  INTO next_num
  FROM public.grn_returns
  WHERE company_id = _company_id;
  RETURN 'DEV-' || LPAD(next_num::text, 4, '0');
END;
$$;

-- Verifica se devolução é permitida (2 dias ou admin)
CREATE OR REPLACE FUNCTION public.can_return_grn(_grn_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  grn_received_at timestamptz;
BEGIN
  SELECT received_at INTO grn_received_at
  FROM public.goods_received_notes
  WHERE id = _grn_id;

  IF grn_received_at IS NULL THEN
    RETURN false;
  END IF;

  -- Admin pode sempre devolver
  IF has_role(_user_id, 'admin') THEN
    RETURN true;
  END IF;

  -- Outros utilizadores: só até 2 dias
  RETURN (now() - grn_received_at) <= interval '2 days';
END;
$$;
