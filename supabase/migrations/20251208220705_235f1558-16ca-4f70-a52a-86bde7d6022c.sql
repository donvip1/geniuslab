-- Add a PERMISSIVE SELECT policy on questions table for authenticated users
-- This allows the questions_public view to work for all authenticated users
CREATE POLICY "Authenticated users can view active questions via view"
ON public.questions
FOR SELECT
TO authenticated
USING (is_active = true);