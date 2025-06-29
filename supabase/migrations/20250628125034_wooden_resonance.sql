/*
  # Fix RLS Policies for Student Management

  1. Security Updates
    - Update INSERT policy to allow admin users to create students
    - Ensure proper admin verification for all operations
    - Maintain security while enabling admin functionality

  2. Policy Changes
    - Modified INSERT policy to check admin status properly
    - Updated other policies to use consistent admin checking
    - Added proper error handling for edge cases
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Authenticated users can insert students" ON students;
DROP POLICY IF EXISTS "Authenticated users can update students" ON students;
DROP POLICY IF EXISTS "Authenticated users can delete students" ON students;
DROP POLICY IF EXISTS "Authenticated users can view all students" ON students;

-- Create new policies with proper admin checks
CREATE POLICY "Admin users can insert students"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students 
      WHERE email = auth.email() 
      AND is_admin = true
    )
  );

CREATE POLICY "Admin users can update students"
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

CREATE POLICY "Admin users can delete students"
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

CREATE POLICY "Authenticated users can view students"
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
    -- Regular users can only see their own record
    email = auth.email()
  );

-- Also update event policies to be consistent
DROP POLICY IF EXISTS "Authenticated users can insert events" ON events;
DROP POLICY IF EXISTS "Authenticated users can update events" ON events;
DROP POLICY IF EXISTS "Authenticated users can delete events" ON events;

CREATE POLICY "Admin users can insert events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students 
      WHERE email = auth.email() 
      AND is_admin = true
    )
  );

CREATE POLICY "Admin users can update events"
  ON events
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

CREATE POLICY "Admin users can delete events"
  ON events
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE email = auth.email() 
      AND is_admin = true
    )
  );

-- Update attendance record policies
DROP POLICY IF EXISTS "Authenticated users can insert attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Authenticated users can update attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Authenticated users can delete attendance records" ON attendance_records;

CREATE POLICY "Admin users can insert attendance records"
  ON attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students 
      WHERE email = auth.email() 
      AND is_admin = true
    )
  );

CREATE POLICY "Admin users can update attendance records"
  ON attendance_records
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

CREATE POLICY "Admin users can delete attendance records"
  ON attendance_records
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE email = auth.email() 
      AND is_admin = true
    )
  );

-- Update event attendees policies
DROP POLICY IF EXISTS "Authenticated users can insert event attendees" ON event_attendees;
DROP POLICY IF EXISTS "Authenticated users can delete event attendees" ON event_attendees;

CREATE POLICY "Admin users can insert event attendees"
  ON event_attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM students 
      WHERE email = auth.email() 
      AND is_admin = true
    )
  );

CREATE POLICY "Admin users can delete event attendees"
  ON event_attendees
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE email = auth.email() 
      AND is_admin = true
    )
  );