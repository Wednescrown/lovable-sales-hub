
-- 1. Fix module_permissions: restrict to authenticated users only
DROP POLICY IF EXISTS "Anyone can view module permissions" ON public.module_permissions;
CREATE POLICY "Authenticated users can view module permissions"
ON public.module_permissions
FOR SELECT
TO authenticated
USING (true);

-- 2. Fix activity_log: restrict to admins or own activity
DROP POLICY IF EXISTS "Users can view activity in same company" ON public.activity_log;
CREATE POLICY "Users can view own activity or admins view all"
ON public.activity_log
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Fix user_roles: restrict to own role or admins
DROP POLICY IF EXISTS "Users can view roles in same company" ON public.user_roles;
CREATE POLICY "Users can view own role or admins view all in company"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 4. Fix profiles: restrict to own profile or admins in same company
DROP POLICY IF EXISTS "Users can view profiles in same company" ON public.profiles;
CREATE POLICY "Users can view own profile or admins view company profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR (company_id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
);
