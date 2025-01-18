/*
  # Create initial admin user
  
  1. Changes
    - Creates admin user in auth.users
    - Creates corresponding admin profile in public.users
*/

-- Create admin user in auth.users
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
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'paularacy@gmail.com',
  crypt('adm@123', gen_salt('bf')),
  now(),
  '{"full_name":"Paula Admin"}'::jsonb,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'paularacy@gmail.com'
);

-- Create admin profile in public.users
INSERT INTO public.users (
  id,
  email,
  full_name,
  is_admin,
  is_active
)
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name',
  true,
  true
FROM auth.users
WHERE email = 'paularacy@gmail.com'
ON CONFLICT (id) DO UPDATE
SET 
  is_admin = true,
  is_active = true;