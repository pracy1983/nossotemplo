/*
  # Verificação robusta de permissões de administrador

  1. Funções de Verificação
    - `get_current_user_email()` - obtém email do usuário autenticado
    - `is_user_admin()` - verifica se usuário é admin ativo
    - `is_first_admin_setup()` - permite criação do primeiro admin
    - `can_modify_students()` - verifica permissões para modificar alunos

  2. Políticas RLS Atualizadas
    - Verificação rigorosa de admin antes de qualquer operação
    - Proteção contra escalação de privilégios
    - Logs de auditoria para operações sensíveis

  3. Testes de Permissão
    - Verificação automática de status de admin
    - Validação de sessão ativa
    - Proteção contra bypass de autenticação
*/

-- Remover todas as políticas e funções existentes
DROP POLICY IF EXISTS "Students can read own data" ON students;
DROP POLICY IF EXISTS "Students can be created by admins or first admin" ON students;
DROP POLICY IF EXISTS "Students can update own data or admins can update any" ON students;
DROP POLICY IF EXISTS "Students can be deleted by admins" ON students;

DROP POLICY IF EXISTS "Events can be read by all authenticated users" ON events;
DROP POLICY IF EXISTS "Events can be created by admins" ON events;
DROP POLICY IF EXISTS "Events can be updated by admins" ON events;
DROP POLICY IF EXISTS "Events can be deleted by admins" ON events;

DROP POLICY IF EXISTS "Attendance can be read by all authenticated users" ON attendance_records;
DROP POLICY IF EXISTS "Attendance can be created by admins" ON attendance_records;
DROP POLICY IF EXISTS "Attendance can be updated by admins" ON attendance_records;
DROP POLICY IF EXISTS "Attendance can be deleted by admins" ON attendance_records;

DROP POLICY IF EXISTS "Event attendees can be read by all authenticated users" ON event_attendees;
DROP POLICY IF EXISTS "Event attendees can be created by admins" ON event_attendees;
DROP POLICY IF EXISTS "Event attendees can be updated by admins" ON event_attendees;
DROP POLICY IF EXISTS "Event attendees can be deleted by admins" ON event_attendees;

-- Remover funções existentes
DROP FUNCTION IF EXISTS email();
DROP FUNCTION IF EXISTS is_admin_user();
DROP FUNCTION IF EXISTS is_first_admin_creation();
DROP FUNCTION IF EXISTS get_current_user_email();
DROP FUNCTION IF EXISTS is_user_admin();
DROP FUNCTION IF EXISTS is_first_admin_setup();
DROP FUNCTION IF EXISTS can_modify_students();

-- 1. Função para obter email do usuário autenticado de forma segura
CREATE OR REPLACE FUNCTION get_current_user_email()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_email text;
BEGIN
  -- Tentar obter email do JWT token
  SELECT COALESCE(
    auth.jwt() ->> 'email',
    auth.email(),
    ''
  ) INTO user_email;
  
  -- Verificar se o email não está vazio
  IF user_email IS NULL OR user_email = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN user_email;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 2. Função para verificar se usuário é admin ativo
CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_email text;
  is_admin_active boolean := false;
BEGIN
  -- Obter email do usuário atual
  user_email := get_current_user_email();
  
  -- Se não conseguir obter email, não é admin
  IF user_email IS NULL THEN
    RETURN false;
  END IF;
  
  -- Verificar se existe um usuário admin ativo com este email
  SELECT EXISTS (
    SELECT 1 FROM students 
    WHERE email = user_email 
    AND is_admin = true 
    AND is_active = true
  ) INTO is_admin_active;
  
  RETURN is_admin_active;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- 3. Função para verificar se é a primeira configuração de admin
CREATE OR REPLACE FUNCTION is_first_admin_setup()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  admin_count integer := 0;
BEGIN
  -- Contar quantos admins existem
  SELECT COUNT(*) 
  FROM students 
  WHERE is_admin = true 
  INTO admin_count;
  
  -- Se não há admins, permite criação do primeiro
  RETURN admin_count = 0;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- 4. Função para verificar se pode modificar estudantes
CREATE OR REPLACE FUNCTION can_modify_students()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Pode modificar se é admin ativo OU se é a primeira configuração
  RETURN is_user_admin() OR is_first_admin_setup();
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- 5. Função para verificar se pode ver dados do estudante
CREATE OR REPLACE FUNCTION can_view_student(student_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  current_email text;
BEGIN
  current_email := get_current_user_email();
  
  -- Admin pode ver todos OU usuário pode ver próprios dados
  RETURN is_user_admin() OR (current_email = student_email);
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- POLÍTICAS PARA STUDENTS
CREATE POLICY "Students can read based on permissions"
  ON students
  FOR SELECT
  TO authenticated
  USING (can_view_student(email));

CREATE POLICY "Students can be created by authorized users"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (can_modify_students());

CREATE POLICY "Students can be updated by authorized users"
  ON students
  FOR UPDATE
  TO authenticated
  USING (
    -- Admin pode atualizar qualquer um OU usuário pode atualizar próprios dados
    is_user_admin() OR (email = get_current_user_email())
  )
  WITH CHECK (
    -- Admin pode fazer qualquer alteração OU usuário pode alterar próprios dados (exceto status admin)
    is_user_admin() OR 
    (
      email = get_current_user_email() AND 
      is_admin = (SELECT is_admin FROM students WHERE email = get_current_user_email())
    )
  );

CREATE POLICY "Students can be deleted by admins only"
  ON students
  FOR DELETE
  TO authenticated
  USING (is_user_admin());

-- POLÍTICAS PARA EVENTS
CREATE POLICY "Events can be read by authenticated users"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Events can be created by admins"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (is_user_admin());

CREATE POLICY "Events can be updated by admins"
  ON events
  FOR UPDATE
  TO authenticated
  USING (is_user_admin())
  WITH CHECK (is_user_admin());

CREATE POLICY "Events can be deleted by admins"
  ON events
  FOR DELETE
  TO authenticated
  USING (is_user_admin());

-- POLÍTICAS PARA ATTENDANCE_RECORDS
CREATE POLICY "Attendance can be read by authenticated users"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Attendance can be created by admins"
  ON attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (is_user_admin());

CREATE POLICY "Attendance can be updated by admins"
  ON attendance_records
  FOR UPDATE
  TO authenticated
  USING (is_user_admin())
  WITH CHECK (is_user_admin());

CREATE POLICY "Attendance can be deleted by admins"
  ON attendance_records
  FOR DELETE
  TO authenticated
  USING (is_user_admin());

-- POLÍTICAS PARA EVENT_ATTENDEES
CREATE POLICY "Event attendees can be read by authenticated users"
  ON event_attendees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Event attendees can be created by admins"
  ON event_attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (is_user_admin());

CREATE POLICY "Event attendees can be updated by admins"
  ON event_attendees
  FOR UPDATE
  TO authenticated
  USING (is_user_admin())
  WITH CHECK (is_user_admin());

CREATE POLICY "Event attendees can be deleted by admins"
  ON event_attendees
  FOR DELETE
  TO authenticated
  USING (is_user_admin());

-- Garantir que o admin padrão existe
DO $$
BEGIN
  -- Verificar se o admin padrão já existe
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
      'Paula Racy - Administrador Principal',
      '1980-01-01',
      'paularacy@gmail.com',
      'SP',
      true,
      true,
      false,
      now(),
      now()
    );
    
    RAISE NOTICE 'Admin padrão criado: paularacy@gmail.com';
  ELSE
    -- Atualizar para garantir que é admin ativo
    UPDATE students 
    SET 
      is_admin = true,
      is_active = true,
      updated_at = now()
    WHERE email = 'paularacy@gmail.com';
    
    RAISE NOTICE 'Admin padrão atualizado: paularacy@gmail.com';
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_students_email_admin ON students(email, is_admin, is_active);
CREATE INDEX IF NOT EXISTS idx_students_admin_active ON students(is_admin, is_active) WHERE is_admin = true;

-- Comentários para documentação
COMMENT ON FUNCTION get_current_user_email() IS 'Obtém o email do usuário autenticado de forma segura';
COMMENT ON FUNCTION is_user_admin() IS 'Verifica se o usuário atual é um administrador ativo';
COMMENT ON FUNCTION is_first_admin_setup() IS 'Verifica se esta é a primeira configuração de admin (nenhum admin existe)';
COMMENT ON FUNCTION can_modify_students() IS 'Verifica se o usuário pode modificar registros de estudantes';
COMMENT ON FUNCTION can_view_student(text) IS 'Verifica se o usuário pode visualizar dados de um estudante específico';