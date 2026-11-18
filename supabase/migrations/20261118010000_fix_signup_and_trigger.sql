-- Fix 1: Make handle_new_user trigger resilient to duplicate usernames.
-- Previously, if two users chose the same username the unique constraint on
-- profiles.username caused the trigger to throw, rolling back the entire
-- auth.users INSERT and leaving the user unable to sign up.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base     text;
  v_username text;
  v_counter  int := 0;
BEGIN
  -- Use the username from metadata; fall back to 'user' if blank/null.
  v_base := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''), 'user');
  v_username := v_base;

  -- If the requested username is already taken, append an incrementing number
  -- until we find a free slot (caps at 999 to avoid an infinite loop).
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_counter  := v_counter + 1;
    v_username := v_base || v_counter::text;
    EXIT WHEN v_counter >= 999;
  END LOOP;

  INSERT INTO public.profiles (user_id, full_name, email, username)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User'),
    NEW.email,
    v_username
  );

  -- ON CONFLICT guard prevents a rare race condition from failing the trigger.
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
