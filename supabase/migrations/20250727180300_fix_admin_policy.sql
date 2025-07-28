-- SCRIPT DE MIGRAÇÃO DEFINITIVO

-- 1. Cria uma função para obter o e-mail do usuário autenticado, com um nome que não conflita com colunas.
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(auth.jwt() ->> 'email', '');
$$;

-- 2. Cria a função que verifica se o usuário é admin, usando a função de e-mail sem ambiguidade.
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

-- 3. Remove a política de segurança (RLS) antiga para evitar conflitos.
DROP POLICY IF EXISTS "Students can update own data or admins can update any" ON public.students;
DROP POLICY IF EXISTS "Admins podem atualizar qualquer usuário, outros apenas a si mesmos" ON public.students;

-- 4. Cria a nova política de segurança que permite a admins promover outros usuários.
CREATE POLICY "Admins podem atualizar qualquer usuário, outros apenas a si mesmos"
ON public.students
FOR UPDATE
TO authenticated
USING (true) -- Permite que a verificação WITH CHECK lide com toda a lógica
WITH CHECK (
  -- Se o usuário for um administrador, ele pode atualizar qualquer registro.
  public.is_admin_user() OR
  -- Se não for admin, ele só pode atualizar o próprio registro (auth.uid() corresponde ao id do aluno)
  -- e a coluna 'is_admin' não pode ser modificada (permanece com seu valor original).
  (auth.uid() = id AND is_admin = (SELECT s.is_admin FROM public.students s WHERE s.id = auth.uid()))
);
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM students 
  );
$$;

-- Drop the existing policy that's causing the issue
DROP POLICY IF EXISTS "Students can update own data or admins can update any" ON public.students;

-- Create a modified policy that allows admins to update any field including is_admin
CREATE POLICY "Admins podem atualizar qualquer usuário, outros apenas a si mesmos"
ON public.students
FOR UPDATE
TO authenticated
USING (true) 
WITH CHECK (
  -- Se o usuário for um administrador, ele pode atualizar qualquer registro.
  public.is_admin_user() OR
  -- Se não for admin, ele só pode atualizar o próprio registro (auth.uid() corresponde ao id do aluno)
  -- e a coluna 'is_admin' não pode ser modificada (permanece com seu valor original).
  (auth.uid() = id AND is_admin = (SELECT s.is_admin FROM public.students s WHERE s.id = auth.uid()))
);
  TO authenticated
  USING (is_admin_user() OR email = auth.email())
  WITH CHECK (
    is_admin_user() OR 
    (email = auth.email() AND (
      -- Non-admins can't change their own admin status
      is_admin = (SELECT is_admin FROM students WHERE students.email = auth.email())
    ))
  );

-- Add a comment to explain the policy
COMMENT ON POLICY "Students can update own data or admins can update any" ON students
  IS 'Allows admins to update any student record including admin status. Regular users can only update their own data except admin status.';
