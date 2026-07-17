-- Allow admins full control over payments table to enable manual admin registration
DROP POLICY IF EXISTS "Admins can do everything on payments" ON public.payments;
CREATE POLICY "Admins can do everything on payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins full control over user_roles table to enable manual admin registration
DROP POLICY IF EXISTS "Admins can do everything on user_roles" ON public.user_roles;
CREATE POLICY "Admins can do everything on user_roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
