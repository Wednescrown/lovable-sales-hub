-- Allow platform admins to view all companies
CREATE POLICY "Platform admins can view all companies"
ON public.companies FOR SELECT
USING (is_platform_admin(auth.uid()));

-- Allow platform admins to update any company
CREATE POLICY "Platform admins can update any company"
ON public.companies FOR UPDATE
USING (is_platform_admin(auth.uid()));

-- Allow platform admins to view all profiles (for user counts)
CREATE POLICY "Platform admins can view all profiles"
ON public.profiles FOR SELECT
USING (is_platform_admin(auth.uid()));