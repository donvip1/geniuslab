-- Create table for PIN generator password settings
CREATE TABLE public.pin_generator_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.pin_generator_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage password settings
CREATE POLICY "Admins can manage pin generator settings"
ON public.pin_generator_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add payment info columns to exam_settings
ALTER TABLE public.exam_settings 
ADD COLUMN IF NOT EXISTS payment_contact text DEFAULT '08124269495',
ADD COLUMN IF NOT EXISTS payment_account_number text DEFAULT '8124269495',
ADD COLUMN IF NOT EXISTS payment_bank_name text DEFAULT 'Opay',
ADD COLUMN IF NOT EXISTS payment_account_holder text DEFAULT 'Nsisong Etim',
ADD COLUMN IF NOT EXISTS payment_amount numeric DEFAULT 1000;

-- Create function to hash password using pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to verify password
CREATE OR REPLACE FUNCTION public.verify_pin_generator_password(input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT password_hash INTO stored_hash FROM public.pin_generator_settings LIMIT 1;
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN stored_hash = crypt(input_password, stored_hash);
END;
$$;

-- Function to set/update password (requires old password for update)
CREATE OR REPLACE FUNCTION public.set_pin_generator_password(
  new_password text,
  old_password text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_record uuid;
  stored_hash text;
BEGIN
  -- Check if user is admin
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Check if a password already exists
  SELECT id, password_hash INTO existing_record, stored_hash FROM public.pin_generator_settings LIMIT 1;
  
  IF existing_record IS NOT NULL THEN
    -- Password exists, verify old password
    IF old_password IS NULL OR stored_hash != crypt(old_password, stored_hash) THEN
      RETURN false;
    END IF;
    
    -- Update existing password
    UPDATE public.pin_generator_settings
    SET password_hash = crypt(new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = existing_record;
  ELSE
    -- No password exists, create new one
    INSERT INTO public.pin_generator_settings (password_hash, created_by)
    VALUES (crypt(new_password, gen_salt('bf')), auth.uid());
  END IF;
  
  RETURN true;
END;
$$;