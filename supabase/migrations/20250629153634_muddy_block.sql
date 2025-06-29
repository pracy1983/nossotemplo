/*
  # Adicionar campos faltantes para importação de membros

  1. Novos Campos
    - `how_found_temple` (text) - Como conheceu o templo
    - `accepts_image_terms` (boolean) - Se aceita os termos de imagem
    - `image_terms_accepted_at` (timestamp) - Quando aceitou os termos

  2. Índices
    - Índice para termos de imagem aceitos
    - Índice para como conheceu o templo

  3. Comentários
    - Documentação dos novos campos
*/

-- Adicionar novos campos na tabela students se não existirem
DO $$
BEGIN
  -- Campo para como conheceu o templo
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'how_found_temple'
  ) THEN
    ALTER TABLE students ADD COLUMN how_found_temple text;
    COMMENT ON COLUMN students.how_found_temple IS 'Como o aluno conheceu o templo';
  END IF;

  -- Campo para aceitar termos de imagem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'accepts_image_terms'
  ) THEN
    ALTER TABLE students ADD COLUMN accepts_image_terms boolean DEFAULT false;
    COMMENT ON COLUMN students.accepts_image_terms IS 'Se o aluno aceita os termos de uso de imagem';
  END IF;

  -- Campo para data de aceitação dos termos
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'image_terms_accepted_at'
  ) THEN
    ALTER TABLE students ADD COLUMN image_terms_accepted_at timestamptz;
    COMMENT ON COLUMN students.image_terms_accepted_at IS 'Data e hora em que aceitou os termos de imagem';
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_students_image_terms ON students(accepts_image_terms) WHERE accepts_image_terms = true;
CREATE INDEX IF NOT EXISTS idx_students_how_found ON students(how_found_temple) WHERE how_found_temple IS NOT NULL;

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Campos de importação adicionados com sucesso:';
  RAISE NOTICE '- how_found_temple: Como conheceu o templo';
  RAISE NOTICE '- accepts_image_terms: Aceita termos de imagem';
  RAISE NOTICE '- image_terms_accepted_at: Data de aceitação dos termos';
END $$;