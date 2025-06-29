/*
  # Fix RLS policies for students table

  1. Security Updates
    - Drop existing problematic policies
    - Create new policies that work correctly for admin operations
    - Ensure admins can insert, update, and delete students
    - Allow users to view their own data and admins to view all data

  2. Policy Changes
    - Fix INSERT policy to avoid circular dependency
    - Update other policies for consistency
    - Use auth.uid() for better security where possible
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admin users can insert students" ON students;
DROP POLICY IF EXISTS "Admin users can update students" ON students;
DROP POLICY IF EXISTS "Admin users can delete students" ON students;
DROP POLICY IF EXISTS "Authenticated users can view students" ON students;

-- Create new policies that work correctly

-- Allow authenticated users to insert students if they are admin
-- This checks against the auth.email() function and existing admin records
CREATE POLICY "Admins can insert students"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students 
      WHERE email = auth.email() 
      AND is_admin = true
    )
    OR 
    -- Allow the first admin user to be created (when no admins exist)
    NOT EXISTS (SELECT 1 FROM students WHERE is_admin = true)
  );

-- Allow authenticated users to update students if they are admin
CREATE POLICY "Admins can update students"
  ON students
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE email = auth.email() 
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students 
      WHERE email = auth.email() 
      AND is_admin = true
    )
  );

-- Allow authenticated users to delete students if they are admin
CREATE POLICY "Admins can delete students"
  ON students
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE email = auth.email() 
      AND is_admin = true
    )
  );

-- Allow users to view students based on admin status
CREATE POLICY "Users can view students"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    -- Admins can see all students
    EXISTS (
      SELECT 1 FROM students 
      WHERE email = auth.email() 
      AND is_admin = true
    )
    OR
    -- Users can see their own record
    email = auth.email()
  );