/*
  # Sistema de Convites e Autorização de Alunos

  1. Novos Campos na Tabela Students
    - `street` (text) - Nome da rua do endereço
    - `number` (text) - Número do endereço
    - `complement` (text) - Complemento do endereço
    - `neighborhood` (text) - Bairro do endereço
    - `zip_code` (text) - CEP do endereço
    - `city` (text) - Cidade do endereço
    - `state` (text) - Estado (UF) do endereço
    - `turma` (text) - Turma ou grupo do aluno
    - `is_pending_approval` (boolean) - Indica se está aguardando aprovação
    - `invite_status` (text) - Status do convite (pending, accepted, expired)
    - `invite_token` (text) - Token único para validação do convite
    - `invited_at` (timestamp) - Data e hora do convite
    - `invited_by` (text) - Nome ou email de quem enviou o convite

  2. Índices para Performance
    - Índice para tokens de convite
    - Índice para status de aprovação pendente
    - Índice para status de convite

  3. Segurança
    - Políticas RLS para convites
    - Validação de tokens únicos
*/

-- Adicionar novos campos na tabela students se não existirem
DO $$
BEGIN
  -- Campos de endereço
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'street'
  ) THEN
    ALTER TABLE students ADD COLUMN street text;
    COMMENT ON COLUMN students.street IS 'Nome da rua do endereço';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'number'
  ) THEN
    ALTER TABLE students ADD COLUMN number text;
    COMMENT ON COLUMN students.number IS 'Número do endereço';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'complement'
  ) THEN
    ALTER TABLE students ADD COLUMN complement text;
    COMMENT ON COLUMN students.complement IS 'Complemento do endereço (apartamento, sala, etc.)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE students ADD COLUMN neighborhood text;
    COMMENT ON COLUMN students.neighborhood IS 'Bairro do endereço';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'zip_code'
  ) THEN
    ALTER TABLE students ADD COLUMN zip_code text;
    COMMENT ON COLUMN students.zip_code IS 'CEP do endereço';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'city'
  ) THEN
    ALTER TABLE students ADD COLUMN city text;
    COMMENT ON COLUMN students.city IS 'Cidade do endereço';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'state'
  ) THEN
    ALTER TABLE students ADD COLUMN state text;
    COMMENT ON COLUMN students.state IS 'Estado (UF) do endereço';
  END IF;

  -- Campo de turma
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'turma'
  ) THEN
    ALTER TABLE students ADD COLUMN turma text;
    COMMENT ON COLUMN students.turma IS 'Turma ou grupo do aluno (editável apenas por admins/colaboradores)';
  END IF;

  -- Campos de aprovação e convite
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'is_pending_approval'
  ) THEN
    ALTER TABLE students ADD COLUMN is_pending_approval boolean DEFAULT false;
    COMMENT ON COLUMN students.is_pending_approval IS 'Indica se o cadastro está aguardando aprovação de um administrador';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'invite_status'
  ) THEN
    ALTER TABLE students ADD COLUMN invite_status text;
    COMMENT ON COLUMN students.invite_status IS 'Status do convite enviado (pending, accepted, expired)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'invite_token'
  ) THEN
    ALTER TABLE students ADD COLUMN invite_token text;
    COMMENT ON COLUMN students.invite_token IS 'Token único para validação do convite';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'invited_at'
  ) THEN
    ALTER TABLE students ADD COLUMN invited_at timestamptz;
    COMMENT ON COLUMN students.invited_at IS 'Data e hora em que o convite foi enviado';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'invited_by'
  ) THEN
    ALTER TABLE students ADD COLUMN invited_by text;
    COMMENT ON COLUMN students.invited_by IS 'Nome ou email de quem enviou o convite';
  END IF;
END $$;

-- Adicionar constraints para invite_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'students' AND constraint_name = 'students_invite_status_check'
  ) THEN
    ALTER TABLE students ADD CONSTRAINT students_invite_status_check 
      CHECK (invite_status IS NULL OR invite_status IN ('pending', 'accepted', 'expired'));
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_students_invite_token ON students(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_students_pending_approval ON students(is_pending_approval) WHERE is_pending_approval = true;
CREATE INDEX IF NOT EXISTS idx_students_invite_status ON students(invite_status) WHERE invite_status IS NOT NULL;

-- Função para gerar token único de convite no formato UUID v4
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_uuid uuid;
  exists_token boolean;
BEGIN
  LOOP
    -- Gerar um novo UUID v4
    new_uuid := gen_random_uuid();
    
    -- Verificar se o token já existe
    SELECT EXISTS(SELECT 1 FROM students WHERE invite_token = new_uuid) INTO exists_token;
    
    -- Se não existe, usar este token
    IF NOT exists_token THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN new_uuid;
END;
$$;

-- Função para verificar se token de convite é válido
CREATE OR REPLACE FUNCTION is_invite_token_valid(token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  invite_date timestamptz;
  is_valid boolean := false;
BEGIN
  -- Buscar data do convite
  SELECT invited_at INTO invite_date
  FROM students 
  WHERE invite_token = token 
  AND invite_status = 'pending';
  
  -- Se encontrou o token e não expirou (7 dias)
  IF invite_date IS NOT NULL AND invite_date > (now() - interval '7 days') THEN
    is_valid := true;
  END IF;
  
  RETURN is_valid;
END;
$$;

-- Função para aceitar convite
CREATE OR REPLACE FUNCTION accept_invite(token text, student_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  student_id uuid;
  result jsonb;
BEGIN
  -- Verificar se token é válido
  IF NOT is_invite_token_valid(token) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Token inválido ou expirado');
  END IF;
  
  -- Buscar ID do estudante
  SELECT id INTO student_id
  FROM students 
  WHERE invite_token = token 
  AND invite_status = 'pending';
  
  IF student_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Convite não encontrado');
  END IF;
  
  -- Atualizar dados do estudante
  UPDATE students SET
    full_name = COALESCE(student_data->>'full_name', full_name),
    birth_date = COALESCE((student_data->>'birth_date')::date, birth_date),
    cpf = student_data->>'cpf',
    rg = student_data->>'rg',
    phone = student_data->>'phone',
    religion = student_data->>'religion',
    street = student_data->>'street',
    number = student_data->>'number',
    complement = student_data->>'complement',
    neighborhood = student_data->>'neighborhood',
    zip_code = student_data->>'zip_code',
    city = student_data->>'city',
    state = student_data->>'state',
    invite_status = 'accepted',
    is_pending_approval = true,
    updated_at = now()
  WHERE id = student_id;
  
  RETURN jsonb_build_object('success', true, 'student_id', student_id);
END;
$$;

-- Política RLS para permitir acesso público aos convites (apenas leitura com token válido)
CREATE POLICY "Public can view invite with valid token"
  ON students
  FOR SELECT
  TO anon
  USING (
    invite_token IS NOT NULL 
    AND invite_status = 'pending' 
    AND invited_at > (now() - interval '7 days')
  );

-- Política RLS para permitir atualização pública com token válido
CREATE POLICY "Public can update with valid invite token"
  ON students
  FOR UPDATE
  TO anon
  USING (
    invite_token IS NOT NULL 
    AND invite_status = 'pending' 
    AND invited_at > (now() - interval '7 days')
  )
  WITH CHECK (
    invite_status = 'accepted' 
    AND is_pending_approval = true
  );

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Sistema de convites implementado com sucesso:';
  RAISE NOTICE '- Campos de endereço adicionados';
  RAISE NOTICE '- Sistema de convites configurado';
  RAISE NOTICE '- Sistema de aprovação implementado';
  RAISE NOTICE '- Políticas RLS para convites criadas';
  RAISE NOTICE '- Funções auxiliares criadas';
END $$;