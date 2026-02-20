
-- Replace overly permissive INSERT policy with a more restrictive one
DROP POLICY IF EXISTS "Authenticated users can create a company" ON public.companies;

-- Only users who don't already belong to a company can create one
CREATE POLICY "Users without company can create one"
  ON public.companies FOR INSERT TO authenticated
  WITH CHECK (get_user_company_id(auth.uid()) IS NULL);
