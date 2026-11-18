CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_base text;
  v_username text;
  v_counter integer := 0;
BEGIN
  v_base := COALESCE(
    NULLIF(BTRIM(NEW.raw_user_meta_data->>'username'), ''),
    'user_' || LEFT(NEW.id::text, 8)
  );
  v_username := v_base;

  LOOP
    WHILE EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE LOWER(username) = LOWER(v_username)
    ) LOOP
      v_counter := v_counter + 1;
      IF v_counter > 10000 THEN
        RAISE EXCEPTION 'Unable to allocate a unique username for new account';
      END IF;
      v_username := v_base || v_counter::text;
    END LOOP;

    INSERT INTO public.profiles (user_id, full_name, email, username)
    VALUES (
      NEW.id,
      COALESCE(NULLIF(BTRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User'),
      NEW.email,
      v_username
    )
    ON CONFLICT (username) DO NOTHING;

    EXIT WHEN FOUND;
    v_counter := v_counter + 1;
    IF v_counter > 10000 THEN
      RAISE EXCEPTION 'Unable to allocate a unique username for new account';
    END IF;
    v_username := v_base || v_counter::text;
  END LOOP;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;