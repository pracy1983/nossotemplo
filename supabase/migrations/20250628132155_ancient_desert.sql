/*
  # Corrigir políticas RLS para permitir operações de admin

  1. Funções auxiliares
    - `is_admin_user()` - verifica se o usuário atual é admin
    - `is_first_admin_creation()` - permite criação do primeiro admin

  2. Políticas RLS
    - Students: admins podem fazer tudo, usuários podem ver próprio perfil
    - Events: admins podem fazer tudo, todos podem visualizar
    - Attendance: admins podem fazer tudo, todos podem visualizar
    - Event attendees: admins podem fazer tudo, todos podem visualizar

  3. Admin padrão
    - Garante que o admin principal existe no sistema
*/

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Admins can insert students" ON students;
DROP POLICY IF EXISTS "Admins can update students" ON students;
DROP POLICY IF EXISTS "Admins can delete students" ON students;
DROP POLICY IF EXISTS "Users can view students" ON students;
DROP POLICY IF EXISTS "Allow authenticated users to insert students" ON students;
DROP POLICY IF EXISTS "Allow authenticated users to select students" ON students;

DROP POLICY IF EXISTS "Admin users can insert events" ON events;
DROP POLICY IF EXISTS "Admin users can update events" ON events;
DROP POLICY IF EXISTS "Admin users can delete events" ON events;
DROP POLICY IF EXISTS "Authenticated users can view all events" ON events;

DROP POLICY IF EXISTS "Admin users can insert attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Admin users can update attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Admin users can delete attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Authenticated users can view attendance records" ON attendance_records;

DROP POLICY IF EXISTS "Admin users can insert event attendees" ON event_attendees;
DROP POLICY IF EXISTS "Admin users can delete event attendees" ON event_attendees;
DROP POLICY IF EXISTS "Authenticated users can view event attendees" ON event_attendees;

-- Remover funções existentes se houver
DROP FUNCTION IF EXISTS is_admin_user();
DROP FUNCTION IF EXISTS is_first_admin_creation();

-- Criar função auxiliar para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM students 
    WHERE email = auth.email() 
    AND is_admin = true
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Criar função para verificar se é o primeiro admin sendo criado
CREATE OR REPLACE FUNCTION is_first_admin_creation()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN NOT EXISTS (SELECT 1 FROM students WHERE is_admin = true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- POLÍTICAS PARA STUDENTS
-- Política para SELECT (visualização)
CREATE POLICY "Students select policy"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    is_admin_user() OR 
    email = auth.email()
  );

-- Política para INSERT (criação)
CREATE POLICY "Students insert policy"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin_user() OR 
    is_first_admin_creation()
  );

-- Política para UPDATE (atualização)
CREATE POLICY "Students update policy"
  ON students
  FOR UPDATE
  TO authenticated
  USING (
    is_admin_user() OR 
    email = auth.email()
  )
  WITH CHECK (
    is_admin_user() OR 
    email = auth.email()
  );

-- Política para DELETE (exclusão)
CREATE POLICY "Students delete policy"
  ON students
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- POLÍTICAS PARA EVENTS
CREATE POLICY "Events select policy"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Events insert policy"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Events update policy"
  ON events
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Events delete policy"
  ON events
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- POLÍTICAS PARA ATTENDANCE_RECORDS
CREATE POLICY "Attendance select policy"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Attendance insert policy"
  ON attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Attendance update policy"
  ON attendance_records
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Attendance delete policy"
  ON attendance_records
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- POLÍTICAS PARA EVENT_ATTENDEES
CREATE POLICY "Event attendees select policy"
  ON event_attendees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event attendees insert policy"
  ON event_attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Event attendees update policy"
  ON event_attendees
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Event attendees delete policy"
  ON event_attendees
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- Garantir que o admin padrão existe na tabela students
INSERT INTO students (
  id,
  full_name,
  birth_date,
  email,
  unit,
  is_admin,
  is_active,
  is_guest,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Administrador Principal',
  '1980-01-01',
  'paularacy@gmail.com',
  'SP',
  true,
  true,
  false,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  is_admin = true,
  is_active = true,
  updated_at = now();