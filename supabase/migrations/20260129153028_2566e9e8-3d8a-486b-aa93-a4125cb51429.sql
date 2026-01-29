-- Drop and recreate functions with proper pgcrypto schema reference
DROP FUNCTION IF EXISTS public.set_pin_generator_password(text, text);
DROP FUNCTION IF EXISTS public.verify_pin_generator_password(text);

-- Function to verify password using extensions schema for pgcrypto
CREATE OR REPLACE FUNCTION public.verify_pin_generator_password(input_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  stored_hash text;
BEGIN
  SELECT password_hash INTO stored_hash FROM public.pin_generator_settings LIMIT 1;
  
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN stored_hash = extensions.crypt(input_password, stored_hash);
END;
$$;

-- Function to set/update password using extensions schema for pgcrypto
CREATE OR REPLACE FUNCTION public.set_pin_generator_password(
  new_password text,
  old_password text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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
    IF old_password IS NULL OR stored_hash != extensions.crypt(old_password, stored_hash) THEN
      RETURN false;
    END IF;
    
    -- Update existing password
    UPDATE public.pin_generator_settings
    SET password_hash = extensions.crypt(new_password, extensions.gen_salt('bf')),
        updated_at = now()
    WHERE id = existing_record;
  ELSE
    -- No password exists, create new one
    INSERT INTO public.pin_generator_settings (password_hash, created_by)
    VALUES (extensions.crypt(new_password, extensions.gen_salt('bf')), auth.uid());
  END IF;
  
  RETURN true;
END;
$$;