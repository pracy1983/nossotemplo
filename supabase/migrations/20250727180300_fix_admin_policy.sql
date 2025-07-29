-- SCRIPT DE MIGRAÇÃO DEFINITIVO

-- 1. Cria uma função para obter o e-mail do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(auth.jwt() ->> 'email', '');
$$;

-- 2. Cria a função que verifica se o usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.students
    WHERE public.students.email = public.get_current_user_email()
    AND public.students.is_admin = true
    AND public.students.is_active = true
  );
$$;

-- 3. Remove as políticas de segurança (RLS) antigas para evitar conflitos
DROP POLICY IF EXISTS "Students can update own data or admins can update any" ON public.students;
DROP POLICY IF EXISTS "Admins podem atualizar qualquer usuário, outros apenas a si mesmos" ON public.students;

-- 4. Cria a nova política de segurança para permissões baseadas em papéis
CREATE POLICY "Admins podem atualizar qualquer usuário, outros apenas a si mesmos"
ON public.students
FOR UPDATE
TO authenticated
USING (
  -- Admins podem ver todos os registros, usuários normais apenas os seus
  public.is_admin_user() OR auth.uid() = id
)
WITH CHECK (
  -- Se o usuário for um administrador, ele pode atualizar qualquer registro
  public.is_admin_user() OR 
  -- Se não for admin, só pode atualizar o próprio registro e não pode mudar status de admin
  (auth.uid() = id AND is_admin = (SELECT s.is_admin FROM public.students s WHERE s.id = auth.uid()))
);

-- 5. Política para leitura de registros
CREATE POLICY "Admins podem ver todos os registros, usuários normais apenas os ativos"
ON public.students
FOR SELECT
TO authenticated
USING (
  public.is_admin_user() OR 
  (auth.uid() = id) OR
  (is_active = true)
);

-- 6. Política para inserção de registros
CREATE POLICY "Apenas admins podem inserir novos usuários"
ON public.students
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin_user()
);

-- 7. Política para exclusão de registros
CREATE POLICY "Apenas admins podem excluir usuários"
ON public.students
FOR DELETE
TO authenticated
USING (
  public.is_admin_user()
);

-- 8. Adiciona comentário para explicar a política principal
COMMENT ON POLICY "Admins podem atualizar qualquer usuário, outros apenas a si mesmos" ON public.students
  IS 'Permite que administradores atualizem qualquer registro de aluno, incluindo status de admin. Usuários comuns só podem atualizar seus próprios dados, exceto status de admin.';
