
-- Create a table to cache questions fetched from external APIs (JAMB, WAEC, NECO, NABTEB)
CREATE TABLE public.cached_api_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_level text NOT NULL, -- e.g. 'JAMB / UTME', 'WAEC / SSCE', 'NECO / SSCE', 'NABTEB / SSCE'
  subject text NOT NULL,
  question_text text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer_index integer NOT NULL DEFAULT 0,
  year text,
  explanation text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique constraint to avoid duplicates
CREATE UNIQUE INDEX idx_cached_questions_unique ON public.cached_api_questions (exam_level, subject, question_text);

-- Create index for fast lookups
CREATE INDEX idx_cached_questions_level_subject ON public.cached_api_questions (exam_level, subject);

-- Enable RLS
ALTER TABLE public.cached_api_questions ENABLE ROW LEVEL SECURITY;

-- Everyone can read cached questions (they're public exam questions)
CREATE POLICY "Everyone can view cached questions"
ON public.cached_api_questions
FOR SELECT
USING (true);

-- Only service role (edge functions) will insert, so no user INSERT policy needed
