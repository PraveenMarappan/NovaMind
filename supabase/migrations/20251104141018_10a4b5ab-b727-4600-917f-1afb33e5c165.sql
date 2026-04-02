-- Create trigger to populate user_roles table on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'::app_role));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically populate user_roles on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Drop the dangerous reports policies that allow any authenticated user full access
DROP POLICY IF EXISTS "All authenticated users can view all reports" ON public.reports;
DROP POLICY IF EXISTS "All authenticated users can update reports" ON public.reports;

-- Create proper role-based policies for counselors
CREATE POLICY "Counselors can view all reports"
ON public.reports FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'counselor'::app_role));

CREATE POLICY "Counselors can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'counselor'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'counselor'::app_role));