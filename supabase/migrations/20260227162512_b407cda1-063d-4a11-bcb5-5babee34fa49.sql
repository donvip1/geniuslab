
-- Add trial configuration columns to exam_settings
ALTER TABLE public.exam_settings
ADD COLUMN IF NOT EXISTS trials_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS trial_duration_days integer NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS trial_max_questions integer NOT NULL DEFAULT 5;
