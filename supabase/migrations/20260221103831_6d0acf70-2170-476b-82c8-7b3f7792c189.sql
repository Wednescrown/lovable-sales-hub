
-- Categories table
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company categories" ON public.categories FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can insert company categories" ON public.categories FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update company categories" ON public.categories FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can delete categories" ON public.categories FOR DELETE USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Subcategories table
CREATE TABLE public.subcategories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  company_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company subcategories" ON public.subcategories FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can insert company subcategories" ON public.subcategories FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update company subcategories" ON public.subcategories FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can delete subcategories" ON public.subcategories FOR DELETE USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON public.subcategories FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Products table
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  name text NOT NULL,
  sku text NOT NULL,
  barcode text,
  category_id uuid REFERENCES public.categories(id),
  subcategory_id uuid REFERENCES public.subcategories(id),
  cost_price numeric NOT NULL DEFAULT 0,
  sell_price numeric NOT NULL DEFAULT 0,
  stock numeric NOT NULL DEFAULT 0,
  min_stock numeric NOT NULL DEFAULT 0,
  pack_size integer NOT NULL DEFAULT 1,
  unit text NOT NULL DEFAULT 'un',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, sku)
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company products" ON public.products FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can insert company products" ON public.products FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update company products" ON public.products FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- SKU generation function
CREATE OR REPLACE FUNCTION public.generate_product_sku(_company_id uuid, _product_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_sku text;
  words text[];
  sku_candidate text;
  counter integer := 0;
BEGIN
  -- Split name into words, take first 3 chars of first 3 words (uppercase)
  words := string_to_array(upper(regexp_replace(trim(_product_name), '\s+', ' ', 'g')), ' ');
  
  base_sku := '';
  FOR i IN 1..LEAST(array_length(words, 1), 3) LOOP
    base_sku := base_sku || LEFT(words[i], 3);
    IF i < LEAST(array_length(words, 1), 3) THEN
      base_sku := base_sku || '-';
    END IF;
  END LOOP;
  
  -- Check uniqueness, append counter if needed
  sku_candidate := base_sku;
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE company_id = _company_id AND sku = sku_candidate) THEN
      RETURN sku_candidate;
    END IF;
    counter := counter + 1;
    sku_candidate := base_sku || '-' || counter;
  END LOOP;
END;
$$;
