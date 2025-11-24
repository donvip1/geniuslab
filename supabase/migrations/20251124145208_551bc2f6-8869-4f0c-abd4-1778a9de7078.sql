-- Create the first admin account securely
-- This handles the case where the trigger already created a profile

DO $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'admin@geniuslab.edu.ng';
  existing_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user_id
  FROM auth.users
  WHERE email = admin_email;

  IF existing_user_id IS NOT NULL THEN
    -- User already exists, just update roles and credentials
    admin_user_id := existing_user_id;
    
    -- Update password
    UPDATE auth.users
    SET encrypted_password = crypt('@GENIUSLAB', gen_salt('bf')),
        updated_at = NOW()
    WHERE id = admin_user_id;
  ELSE
    -- Create new admin user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      admin_email,
      crypt('@GENIUSLAB', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"GeniusLab Admin"}',
      NOW(),
      NOW(),
      '',
      '',
      ''
    )
    RETURNING id INTO admin_user_id;
  END IF;

  -- Ensure profile exists (trigger should create it, but check anyway)
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (admin_user_id, 'GeniusLab Admin', admin_email)
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = 'GeniusLab Admin';

  -- Ensure admin role exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Create or update admin credentials
  INSERT INTO public.admin_credentials (username, user_id)
  VALUES ('@GENIUS_LAB', admin_user_id)
  ON CONFLICT (username) DO UPDATE
  SET user_id = admin_user_id;

  RAISE NOTICE 'Admin account configured: username=@GENIUS_LAB, email=%', admin_email;
END $$;