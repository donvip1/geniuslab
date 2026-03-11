
CREATE OR REPLACE FUNCTION public.get_category_leaderboard(p_category_id uuid, p_mode text DEFAULT NULL)
RETURNS TABLE(rank bigint, user_id uuid, username text, full_name text, score integer, total_questions integer, percentage numeric, subject_name text, created_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
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
  WHERE (
    -- Match directly if subject_id = category_id (JAMB style)
    ea.subject_id = p_category_id
    OR
    -- Match if subject belongs to the category
    s.exam_category_id = p_category_id
  )
  AND (
    p_mode IS NULL
    OR ea.answers->>'mode' = p_mode
  )
  ORDER BY (ea.score::numeric / ea.total_questions) DESC, ea.created_at ASC
  LIMIT 10;
$$;

CREATE OR REPLACE FUNCTION public.get_user_rank_by_category(p_user_id uuid, p_category_id uuid, p_mode text DEFAULT NULL)
RETURNS TABLE(rank bigint, score integer, total_questions integer, percentage numeric)
LANGUAGE sql
STABLE SECURITY DEFINER
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
    LEFT JOIN subjects s ON s.id = ea.subject_id
    WHERE (
      ea.subject_id = p_category_id
      OR s.exam_category_id = p_category_id
    )
    AND (
      p_mode IS NULL
      OR ea.answers->>'mode' = p_mode
    )
  )
  SELECT rank, score, total_questions, percentage
  FROM ranked
  WHERE user_id = p_user_id
  ORDER BY percentage DESC
  LIMIT 1;
$$;
