/*
  # Verificação e correção das permissões RLS

  1. Funções auxiliares
    - `is_admin_user()` - verifica se o usuário é admin
    - `is_first_admin_creation()` - permite criação do primeiro admin
    - `email()` - função para obter email do usuário autenticado

  2. Políticas RLS
    - Students: admins podem tudo, usuários podem ver próprios dados
    - Events: admins podem tudo, usuários podem visualizar
    - Attendance: admins podem tudo, usuários podem visualizar
    - Event attendees: admins podem tudo, usuários podem visualizar

  3. Dados iniciais
    - Criação do usuário admin padrão
*/

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Students select policy" ON students;
DROP POLICY IF EXISTS "Students insert policy" ON students;
DROP POLICY IF EXISTS "Students update policy" ON students;
DROP POLICY IF EXISTS "Students delete policy" ON students;

DROP POLICY IF EXISTS "Events select policy" ON events;
DROP POLICY IF EXISTS "Events insert policy" ON events;
DROP POLICY IF EXISTS "Events update policy" ON events;
DROP POLICY IF EXISTS "Events delete policy" ON events;

DROP POLICY IF EXISTS "Attendance select policy" ON attendance_records;
DROP POLICY IF EXISTS "Attendance insert policy" ON attendance_records;
DROP POLICY IF EXISTS "Attendance update policy" ON attendance_records;
DROP POLICY IF EXISTS "Attendance delete policy" ON attendance_records;

DROP POLICY IF EXISTS "Event attendees select policy" ON event_attendees;
DROP POLICY IF EXISTS "Event attendees insert policy" ON event_attendees;
DROP POLICY IF EXISTS "Event attendees update policy" ON event_attendees;
DROP POLICY IF EXISTS "Event attendees delete policy" ON event_attendees;

-- Remover funções existentes
DROP FUNCTION IF EXISTS is_admin_user();
DROP FUNCTION IF EXISTS is_first_admin_creation();
DROP FUNCTION IF EXISTS email();

-- Criar função para obter email do usuário autenticado
CREATE OR REPLACE FUNCTION email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(auth.jwt() ->> 'email', '');
$$;

-- Criar função auxiliar para verificar se usuário é admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM students 
    WHERE email = email() 
    AND is_admin = true
    AND is_active = true
  );
$$;

-- Criar função para verificar se é o primeiro admin sendo criado
CREATE OR REPLACE FUNCTION is_first_admin_creation()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT NOT EXISTS (SELECT 1 FROM students WHERE is_admin = true);
$$;

-- POLÍTICAS PARA STUDENTS
CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (is_admin_user() OR email = email());

CREATE POLICY "Students can be created by admins or first admin"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (is_first_admin_creation() OR is_admin_user());

CREATE POLICY "Students can update own data or admins can update any"
  ON students
  FOR UPDATE
  TO authenticated
  USING (is_admin_user() OR email = email())
  WITH CHECK (
    is_admin_user() OR 
    (email = email() AND is_admin = (SELECT is_admin FROM students WHERE students.email = email()))
  );

CREATE POLICY "Students can be deleted by admins"
  ON students
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- POLÍTICAS PARA EVENTS
CREATE POLICY "Events can be read by all authenticated users"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Events can be created by admins"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Events can be updated by admins"
  ON events
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Events can be deleted by admins"
  ON events
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- POLÍTICAS PARA ATTENDANCE_RECORDS
CREATE POLICY "Attendance can be read by all authenticated users"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Attendance can be created by admins"
  ON attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Attendance can be updated by admins"
  ON attendance_records
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Attendance can be deleted by admins"
  ON attendance_records
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- POLÍTICAS PARA EVENT_ATTENDEES
CREATE POLICY "Event attendees can be read by all authenticated users"
  ON event_attendees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event attendees can be created by admins"
  ON event_attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_user());

CREATE POLICY "Event attendees can be updated by admins"
  ON event_attendees
  FOR UPDATE
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

CREATE POLICY "Event attendees can be deleted by admins"
  ON event_attendees
  FOR DELETE
  TO authenticated
  USING (is_admin_user());

-- Garantir que o admin padrão existe na tabela students
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM students WHERE email = 'paularacy@gmail.com') THEN
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
    );
  ELSE
    UPDATE students 
    SET 
      is_admin = true,
      is_active = true,
      updated_at = now()
    WHERE email = 'paularacy@gmail.com';
  END IF;
END $$;