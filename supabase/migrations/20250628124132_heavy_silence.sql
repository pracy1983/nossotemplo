/*
  # Update RLS policies for authenticated users

  1. Security
    - Update RLS policies to work with Supabase Auth
    - Allow authenticated users to perform CRUD operations
    - Ensure proper security for all tables

  2. Changes
    - Update policies for students table
    - Update policies for events table  
    - Update policies for attendance_records table
    - Update policies for event_attendees table
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os estudantes" ON students;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir estudantes" ON students;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar estudantes" ON students;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar estudantes" ON students;

DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os eventos" ON events;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir eventos" ON events;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar eventos" ON events;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar eventos" ON events;

DROP POLICY IF EXISTS "Usuários autenticados podem ver registros de presença" ON attendance_records;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir registros de presença" ON attendance_records;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar registros de presença" ON attendance_records;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar registros de presença" ON attendance_records;

DROP POLICY IF EXISTS "Usuários autenticados podem ver participantes de eventos" ON event_attendees;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir participantes de eventos" ON event_attendees;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar participantes de eventos" ON event_attendees;

-- Create new policies for students table
CREATE POLICY "Authenticated users can view all students"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert students"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update students"
  ON students
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete students"
  ON students
  FOR DELETE
  TO authenticated
  USING (true);

-- Create new policies for events table
CREATE POLICY "Authenticated users can view all events"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete events"
  ON events
  FOR DELETE
  TO authenticated
  USING (true);

-- Create new policies for attendance_records table
CREATE POLICY "Authenticated users can view attendance records"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert attendance records"
  ON attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update attendance records"
  ON attendance_records
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete attendance records"
  ON attendance_records
  FOR DELETE
  TO authenticated
  USING (true);

-- Create new policies for event_attendees table
CREATE POLICY "Authenticated users can view event attendees"
  ON event_attendees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert event attendees"
  ON event_attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete event attendees"
  ON event_attendees
  FOR DELETE
  TO authenticated
  USING (true);