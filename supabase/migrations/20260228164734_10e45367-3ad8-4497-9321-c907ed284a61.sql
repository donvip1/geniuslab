
-- Create a SECURITY DEFINER function for leaderboard (top 10 by percentage)
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  username text,
  full_name text,
  score integer,
  total_questions integer,
  percentage numeric,
  subject_name text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ROW_NUMBER() OVER (ORDER BY (ea.score::numeric / ea.total_questions) DESC, ea.created_at ASC) AS rank,
    ea.user_id,
    p.username,
    p.full_name,
    ea.score,
    ea.total_questions,
    ROUND((ea.score::numeric / ea.total_questions) * 100, 1) AS percentage,
    COALESCE(s.name, ec.name, 'Unknown') AS subject_name,
    ea.created_at
  FROM exam_attempts ea
  JOIN profiles p ON p.user_id = ea.user_id
  LEFT JOIN subjects s ON s.id = ea.subject_id
  LEFT JOIN exam_categories ec ON ec.id = ea.subject_id
  ORDER BY (ea.score::numeric / ea.total_questions) DESC, ea.created_at ASC
  LIMIT 10;
$$;

-- Also create a function to get a specific user's best rank
CREATE OR REPLACE FUNCTION public.get_user_rank(p_user_id uuid)
RETURNS TABLE(
  rank bigint,
  score integer,
  total_questions integer,
  percentage numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH ranked AS (
    SELECT
      ROW_NUMBER() OVER (ORDER BY (ea.score::numeric / ea.total_questions) DESC, ea.created_at ASC) AS rank,
      ea.user_id,
      ea.score,
      ea.total_questions,
      ROUND((ea.score::numeric / ea.total_questions) * 100, 1) AS percentage
    FROM exam_attempts ea
  )
  SELECT rank, score, total_questions, percentage
  FROM ranked
  WHERE user_id = p_user_id
  ORDER BY percentage DESC
  LIMIT 1;
$$;
