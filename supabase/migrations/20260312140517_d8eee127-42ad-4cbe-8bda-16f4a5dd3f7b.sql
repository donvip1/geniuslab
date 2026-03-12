-- 1. Function to look up email by username for login
CREATE OR REPLACE FUNCTION public.get_email_by_username(p_username text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM public.profiles WHERE lower(username) = lower(p_username) LIMIT 1;
$$;

-- 2. Add lifetime total_questions_used to user_trials
ALTER TABLE public.user_trials ADD COLUMN IF NOT EXISTS total_questions_used integer NOT NULL DEFAULT 0;