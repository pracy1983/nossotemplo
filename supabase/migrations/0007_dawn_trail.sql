/*
  # Fix import permissions

  1. Changes
    - Add policy to allow importing users
    - Update existing admin policies
  
  2. Security
    - Ensure only admins can import users
    - Maintain existing security constraints
*/

-- Update admin insert policy to be more permissive
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );

-- Ensure admins can update their own admin status
CREATE POLICY "Admins can update admin status"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.is_admin = true
    )
  );