/*
  # Create new user function

  1. Changes
    - Creates create_new_user function
    - Handles user creation with proper validation
    - Maintains data consistency
*/

CREATE OR REPLACE FUNCTION public.create_new_user(user_data JSONB)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Validate required fields
  IF user_data->>'email' IS NULL THEN
    RAISE EXCEPTION 'Email is required';
  END IF;

  IF user_data->>'full_name' IS NULL THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;

  -- Insert into auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_data->>'email',
    crypt(user_data->>'password', gen_salt('bf')),
    now(),
    jsonb_build_object(
      'full_name', user_data->>'full_name',
      'is_admin', false
    ),
    now(),
    now()
  ) RETURNING id INTO new_user_id;

  -- Insert into public.users
  INSERT INTO public.users (
    id,
    full_name,
    email,
    is_admin,
    is_active
  ) VALUES (
    new_user_id,
    user_data->>'full_name',
    user_data->>'email',
    false,
    true
  );

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated role
GRANT EXECUTE ON FUNCTION public.create_new_user TO authenticated;
