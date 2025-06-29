/*
  # Fix Student Creation RLS Policy

  1. Security Updates
    - Update the students INSERT policy to properly handle first admin creation
    - Ensure the is_first_admin_creation function works correctly
    - Add proper policy for admin users to create students

  2. Changes
    - Create or replace the is_first_admin_creation function
    - Update the students INSERT policy to be more permissive for first admin
    - Ensure proper authentication flow
*/

-- Create or replace the function to check if this is the first admin creation
CREATE OR REPLACE FUNCTION is_first_admin_creation()
RETURNS BOOLEAN AS $$
BEGIN
  -- Allow creation if there are no admin users in the system
  RETURN NOT EXISTS (
    SELECT 1 FROM students WHERE is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or replace the function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if the current authenticated user has admin privileges
  RETURN EXISTS (
    SELECT 1 FROM students 
    WHERE email = auth.email() 
    AND is_admin = true 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing INSERT policy and create a new one
DROP POLICY IF EXISTS "Students insert policy" ON students;

CREATE POLICY "Students insert policy"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if this is the first admin creation (no admins exist)
    is_first_admin_creation() 
    OR 
    -- Allow if current user is an admin
    is_admin_user()
  );

-- Ensure the SELECT policy allows users to read their own data and admins to read all
DROP POLICY IF EXISTS "Students select policy" ON students;

CREATE POLICY "Students select policy"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all students
    is_admin_user() 
    OR 
    -- Users can see their own record
    email = auth.email()
  );

-- Update the UPDATE policy to be more explicit
DROP POLICY IF EXISTS "Students update policy" ON students;

CREATE POLICY "Students update policy"
  ON students
  FOR UPDATE
  TO authenticated
  USING (
    -- Admins can update any student
    is_admin_user() 
    OR 
    -- Users can update their own record
    email = auth.email()
  )
  WITH CHECK (
    -- Admins can update any student
    is_admin_user() 
    OR 
    -- Users can update their own record (but not admin status)
    (email = auth.email() AND is_admin = (SELECT is_admin FROM students WHERE email = auth.email()))
  );

-- Ensure DELETE policy only allows admins
DROP POLICY IF EXISTS "Students delete policy" ON students;

CREATE POLICY "Students delete policy"
  ON students
  FOR DELETE
  TO authenticated
  USING (is_admin_user());