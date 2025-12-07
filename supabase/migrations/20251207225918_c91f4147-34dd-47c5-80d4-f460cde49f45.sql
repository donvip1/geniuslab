-- Drop existing restrictive policies on subjects table
DROP POLICY IF EXISTS "Everyone can view active subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;

-- Create PERMISSIVE policy for everyone to view active subjects
CREATE POLICY "Everyone can view active subjects"
ON public.subjects
FOR SELECT
USING (is_active = true);

-- Create PERMISSIVE policy for admins to manage all subjects
CREATE POLICY "Admins can manage subjects"
ON public.subjects
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));