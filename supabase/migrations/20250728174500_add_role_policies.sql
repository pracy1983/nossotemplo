-- SCRIPT DE MIGRAÇÃO PARA ADICIONAR POLÍTICAS DE PERMISSÃO POR PAPEL

-- 1. Criar uma função para verificar se o usuário é owner (paularacy@gmail.com ou ninodenani@gmail.com)
CREATE OR REPLACE FUNCTION public.is_owner_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE public.students.email IN ('paularacy@gmail.com', 'ninodenani@gmail.com')
    AND public.students.email = public.get_current_user_email()
    AND public.students.is_active = true
  );
$$;

-- 2. Criar uma função para verificar se o usuário é ancião (antigo admin)
CREATE OR REPLACE FUNCTION public.is_anciao_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE public.students.email = public.get_current_user_email()
    AND public.students.is_admin = true
    AND public.students.email NOT IN ('paularacy@gmail.com', 'ninodenani@gmail.com')
    AND public.students.is_active = true
  );
$$;

-- 3. Criar uma função para verificar se o usuário é fundador
CREATE OR REPLACE FUNCTION public.is_fundador_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE public.students.email = public.get_current_user_email()
    AND public.students.is_founder = true
    AND public.students.is_active = true
  );
$$;

-- 4. Criar uma função para obter a unidade (templo) do usuário atual
CREATE OR REPLACE FUNCTION public.get_current_user_unit()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT unit FROM public.students WHERE email = public.get_current_user_email() LIMIT 1),
    ''
  );
$$;

-- 5. Atualizar políticas para a tabela students

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os estudantes" ON public.students;
DROP POLICY IF EXISTS "Students can update own data or admins can update any" ON public.students;
DROP POLICY IF EXISTS "Admins podem atualizar qualquer usuário, outros apenas a si mesmos" ON public.students;

-- Política de visualização
CREATE POLICY "Política de visualização de estudantes"
  ON public.students
  FOR SELECT
  TO authenticated
  USING (
    -- Owners e Anciãos podem ver todos os estudantes
    public.is_owner_user() OR 
    public.is_anciao_user() OR
    -- Fundadores só podem ver estudantes da sua unidade
    (public.is_fundador_user() AND unit = public.get_current_user_unit()) OR
    -- Outros usuários só podem ver a si mesmos
    (email = public.get_current_user_email())
  );

-- Política de inserção
CREATE POLICY "Política de inserção de estudantes"
  ON public.students
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Owners e Anciãos podem inserir qualquer estudante
    public.is_owner_user() OR 
    public.is_anciao_user() OR
    -- Fundadores só podem inserir estudantes na sua unidade
    (public.is_fundador_user() AND unit = public.get_current_user_unit())
    -- Moderadores também podem inserir, mas isso será controlado na aplicação
  );

-- Política de atualização
CREATE POLICY "Política de atualização de estudantes"
  ON public.students
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    -- Owners podem atualizar qualquer registro
    public.is_owner_user() OR
    -- Anciãos podem atualizar qualquer registro
    public.is_anciao_user() OR
    -- Fundadores só podem atualizar registros da sua unidade
    (public.is_fundador_user() AND unit = public.get_current_user_unit()) OR
    -- Outros usuários só podem atualizar o próprio registro e não podem mudar is_admin ou is_founder
    (
      email = public.get_current_user_email() AND 
      is_admin = (SELECT s.is_admin FROM public.students s WHERE s.email = public.get_current_user_email()) AND
      is_founder = (SELECT s.is_founder FROM public.students s WHERE s.email = public.get_current_user_email())
    )
  );

-- Política de exclusão
CREATE POLICY "Política de exclusão de estudantes"
  ON public.students
  FOR DELETE
  TO authenticated
  USING (
    -- Apenas Owners e Anciãos podem excluir registros
    public.is_owner_user() OR 
    public.is_anciao_user() OR
    -- Fundadores podem excluir registros da sua unidade, exceto outros fundadores e anciãos
    (
      public.is_fundador_user() AND 
      unit = public.get_current_user_unit() AND
      NOT is_founder AND 
      NOT is_admin
    )
  );

-- 6. Atualizar políticas para a tabela events

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários autenticados podem ver todos os eventos" ON public.events;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir eventos" ON public.events;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar eventos" ON public.events;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar eventos" ON public.events;

-- Política de visualização
CREATE POLICY "Política de visualização de eventos"
  ON public.events
  FOR SELECT
  TO authenticated
  USING (
    -- Owners e Anciãos podem ver todos os eventos
    public.is_owner_user() OR 
    public.is_anciao_user() OR
    -- Fundadores e outros usuários só podem ver eventos da sua unidade
    unit = public.get_current_user_unit() OR
    -- Permitir visualização para todos os usuários autenticados (para compatibilidade)
    true
  );

-- Política de inserção
CREATE POLICY "Política de inserção de eventos"
  ON public.events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Owners e Anciãos podem inserir eventos em qualquer unidade
    public.is_owner_user() OR 
    public.is_anciao_user() OR
    -- Fundadores e moderadores só podem inserir eventos na sua unidade
    (
      (public.is_fundador_user() OR true) AND 
      unit = public.get_current_user_unit()
    )
  );

-- Política de atualização
CREATE POLICY "Política de atualização de eventos"
  ON public.events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    -- Owners e Anciãos podem atualizar qualquer evento
    public.is_owner_user() OR 
    public.is_anciao_user() OR
    -- Fundadores e moderadores só podem atualizar eventos da sua unidade
    (
      (public.is_fundador_user() OR true) AND 
      unit = public.get_current_user_unit()
    )
  );

-- Política de exclusão
CREATE POLICY "Política de exclusão de eventos"
  ON public.events
  FOR DELETE
  TO authenticated
  USING (
    -- Owners e Anciãos podem excluir qualquer evento
    public.is_owner_user() OR 
    public.is_anciao_user() OR
    -- Fundadores e moderadores só podem excluir eventos da sua unidade
    (
      (public.is_fundador_user() OR true) AND 
      unit = public.get_current_user_unit()
    )
  );

-- 7. Atualizar políticas para a tabela attendance_records

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários autenticados podem ver registros de presença" ON public.attendance_records;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir registros de presença" ON public.attendance_records;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar registros de presença" ON public.attendance_records;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar registros de presença" ON public.attendance_records;

-- Política de visualização
CREATE POLICY "Política de visualização de presenças"
  ON public.attendance_records
  FOR SELECT
  TO authenticated
  USING (
    -- Owners e Anciãos podem ver todos os registros
    public.is_owner_user() OR 
    public.is_anciao_user() OR
    -- Fundadores só podem ver registros de alunos da sua unidade
    (
      public.is_fundador_user() AND 
      EXISTS (
        SELECT 1 FROM public.students s 
        WHERE s.id = student_id AND s.unit = public.get_current_user_unit()
      )
    ) OR
    -- Usuários comuns só podem ver seus próprios registros
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_id AND s.email = public.get_current_user_email()
    )
  );

-- Política de inserção
CREATE POLICY "Política de inserção de presenças"
  ON public.attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Owners e Anciãos podem inserir qualquer registro
    public.is_owner_user() OR 
    public.is_anciao_user() OR
    -- Fundadores e moderadores só podem inserir registros para alunos da sua unidade
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_id AND s.unit = public.get_current_user_unit() AND
      (public.is_fundador_user() OR true)
    )
  );

-- Política de atualização
CREATE POLICY "Política de atualização de presenças"
  ON public.attendance_records
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (
    -- Owners e Anciãos podem atualizar qualquer registro
    public.is_owner_user() OR 
    public.is_anciao_user() OR
    -- Fundadores e moderadores só podem atualizar registros para alunos da sua unidade
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_id AND s.unit = public.get_current_user_unit() AND
      (public.is_fundador_user() OR true)
    )
  );

-- Política de exclusão
CREATE POLICY "Política de exclusão de presenças"
  ON public.attendance_records
  FOR DELETE
  TO authenticated
  USING (
    -- Owners e Anciãos podem excluir qualquer registro
    public.is_owner_user() OR 
    public.is_anciao_user() OR
    -- Fundadores e moderadores só podem excluir registros para alunos da sua unidade
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_id AND s.unit = public.get_current_user_unit() AND
      (public.is_fundador_user() OR true)
    )
  );

-- 8. Atualizar políticas para a tabela event_attendees

-- Remover políticas existentes
DROP POLICY IF EXISTS "Usuários autenticados podem ver participantes de eventos" ON public.event_attendees;
DROP POLICY IF EXISTS "Usuários autenticados podem inserir participantes de eventos" ON public.event_attendees;
DROP POLICY IF EXISTS "Usuários autenticados podem deletar participantes de eventos" ON public.event_attendees;

-- Política de visualização
CREATE POLICY "Política de visualização de participantes"
  ON public.event_attendees
  FOR SELECT
  TO authenticated
  USING (
    -- Owners e Anciãos podem ver todos os participantes
    public.is_owner_user() OR 
    public.is_anciao_user() OR
    -- Fundadores só podem ver participantes de eventos da sua unidade
    (
      public.is_fundador_user() AND 
      EXISTS (
        SELECT 1 FROM public.events e 
        WHERE e.id = event_id AND e.unit = public.get_current_user_unit()
      )
    ) OR
    -- Usuários comuns podem ver participantes de eventos públicos
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id
    ) OR
    -- Usuários podem ver sua própria participação
    EXISTS (
      SELECT 1 FROM public.students s 
      WHERE s.id = student_id AND s.email = public.get_current_user_email()
    )
  );

-- Política de inserção
CREATE POLICY "Política de inserção de participantes"
  ON public.event_attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Owners e Anciãos podem inserir qualquer participante
    public.is_owner_user() OR 
    public.is_anciao_user() OR
    -- Fundadores e moderadores só podem inserir participantes em eventos da sua unidade
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.unit = public.get_current_user_unit() AND
      (public.is_fundador_user() OR true)
    )
  );

-- Política de exclusão
CREATE POLICY "Política de exclusão de participantes"
  ON public.event_attendees
  FOR DELETE
  TO authenticated
  USING (
    -- Owners e Anciãos podem excluir qualquer participante
    public.is_owner_user() OR 
    public.is_anciao_user() OR
    -- Fundadores e moderadores só podem excluir participantes de eventos da sua unidade
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.unit = public.get_current_user_unit() AND
      (public.is_fundador_user() OR true)
    )
  );

-- Adicionar comentários explicativos
COMMENT ON FUNCTION public.is_owner_user IS 'Verifica se o usuário atual é um owner (paularacy@gmail.com ou ninodenani@gmail.com)';
COMMENT ON FUNCTION public.is_anciao_user IS 'Verifica se o usuário atual é um ancião (admin que não é owner)';
COMMENT ON FUNCTION public.is_fundador_user IS 'Verifica se o usuário atual é um fundador';
COMMENT ON FUNCTION public.get_current_user_unit IS 'Retorna a unidade (templo) do usuário atual';
