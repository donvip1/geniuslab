
-- Add access_mode to exam_categories: 'free' = all questions open, 'pin' = require PIN/subscription
ALTER TABLE public.exam_categories ADD COLUMN access_mode text NOT NULL DEFAULT 'free';

-- Set all categories to 'free' initially as per user request (allow all users access for now)
UPDATE public.exam_categories SET access_mode = 'free';
