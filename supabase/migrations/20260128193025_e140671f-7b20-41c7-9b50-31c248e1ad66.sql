-- Add exam lock columns to exam_settings
ALTER TABLE public.exam_settings 
ADD COLUMN IF NOT EXISTS is_exams_locked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS lock_message text;

-- Create user_restrictions table
CREATE TABLE public.user_restrictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  restriction_type text NOT NULL CHECK (restriction_type IN ('paused', 'suspended', 'banned')),
  reason text,
  restricted_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true
);

-- Enable RLS
ALTER TABLE public.user_restrictions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all restrictions
CREATE POLICY "Admins can manage user restrictions"
ON public.user_restrictions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own restrictions
CREATE POLICY "Users can view their own restrictions"
ON public.user_restrictions
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_restrictions_user_id ON public.user_restrictions(user_id);
CREATE INDEX idx_user_restrictions_email ON public.user_restrictions(email);
CREATE INDEX idx_user_restrictions_active ON public.user_restrictions(is_active) WHERE is_active = true;