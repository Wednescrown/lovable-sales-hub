
-- Create branch_stock table for per-branch inventory tracking
CREATE TABLE public.branch_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, branch_id)
);

-- Enable RLS
ALTER TABLE public.branch_stock ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view company branch stock"
  ON public.branch_stock FOR SELECT
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can insert company branch stock"
  ON public.branch_stock FOR INSERT
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company branch stock"
  ON public.branch_stock FOR UPDATE
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Admins can delete branch stock"
  ON public.branch_stock FOR DELETE
  USING (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_branch_stock_updated_at
  BEFORE UPDATE ON public.branch_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Index for common queries
CREATE INDEX idx_branch_stock_product ON public.branch_stock(product_id);
CREATE INDEX idx_branch_stock_branch ON public.branch_stock(branch_id);
CREATE INDEX idx_branch_stock_company ON public.branch_stock(company_id);
