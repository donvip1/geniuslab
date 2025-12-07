-- Remove the existing public SELECT policy that exposes all columns
DROP POLICY IF EXISTS "Everyone can view active questions" ON public.questions;

-- Create a secure view that excludes correct_answer and explanation
CREATE OR REPLACE VIEW public.questions_public AS
SELECT 
  id,
  subject_id,
  question_text,
  option_a,
  option_b,
  option_c,
  option_d,
  is_active,
  created_at,
  updated_at
FROM public.questions
WHERE is_active = true;

-- Grant SELECT access on the view to authenticated users
GRANT SELECT ON public.questions_public TO authenticated;
GRANT SELECT ON public.questions_public TO anon;