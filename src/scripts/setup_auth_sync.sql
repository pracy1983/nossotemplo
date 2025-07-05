-- Função para verificar se uma coluna existe em uma tabela
CREATE OR REPLACE FUNCTION public.check_column_exists(table_name text, column_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  column_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = check_column_exists.table_name
    AND column_name = check_column_exists.column_name
  ) INTO column_exists;
  
  RETURN column_exists;
END;
$$;

-- Função para adicionar a coluna auth_user_id à tabela students
CREATE OR REPLACE FUNCTION public.add_auth_user_id_column()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  ALTER TABLE public.students ADD COLUMN IF NOT EXISTS auth_user_id UUID;
END;
$$;

-- Função para executar SQL arbitrário (use com cuidado)
CREATE OR REPLACE FUNCTION public.execute_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;
