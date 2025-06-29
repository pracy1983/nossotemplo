/*
  # Sistema de Turmas e Aulas

  1. Novas Tabelas
    - `turmas`
      - `id` (uuid, primary key)
      - `unit` (text, templo)
      - `numero` (integer, número da turma)
      - `valor` (decimal, valor da turma)
      - `data_inicio` (date, data de início)
      - `hora` (text, horário)
      - `duracao_meses` (integer, duração em meses)
      - `status` (text, status da turma)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `aulas`
      - `id` (uuid, primary key)
      - `turma_id` (uuid, foreign key)
      - `data` (date, data da aula)
      - `conteudo` (text, conteúdo da aula)
      - `realizada` (boolean, se foi realizada)
      - `created_at` (timestamp)

    - `turma_alunos`
      - `id` (uuid, primary key)
      - `turma_id` (uuid, foreign key)
      - `student_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados
*/

-- Criar tabela de turmas
CREATE TABLE IF NOT EXISTS turmas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit text NOT NULL CHECK (unit IN ('SP', 'BH', 'CP')),
  numero integer NOT NULL,
  valor decimal(10,2) NOT NULL DEFAULT 0,
  data_inicio date NOT NULL,
  hora text NOT NULL,
  duracao_meses integer NOT NULL DEFAULT 6,
  status text NOT NULL DEFAULT 'planejada' CHECK (status IN ('planejada', 'em-andamento', 'encerrada')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(unit, numero)
);

-- Criar tabela de aulas
CREATE TABLE IF NOT EXISTS aulas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id uuid NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  data date NOT NULL,
  conteudo text DEFAULT '',
  realizada boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(turma_id, data)
);

-- Criar tabela de relacionamento turma-alunos
CREATE TABLE IF NOT EXISTS turma_alunos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id uuid NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(turma_id, student_id)
);

-- Habilitar RLS
ALTER TABLE turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE turma_alunos ENABLE ROW LEVEL SECURITY;

-- Políticas para turmas
CREATE POLICY "Allow authenticated users to read turmas"
  ON turmas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert turmas"
  ON turmas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update turmas"
  ON turmas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete turmas"
  ON turmas
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para aulas
CREATE POLICY "Allow authenticated users to read aulas"
  ON aulas
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert aulas"
  ON aulas
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update aulas"
  ON aulas
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete aulas"
  ON aulas
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para turma_alunos
CREATE POLICY "Allow authenticated users to read turma_alunos"
  ON turma_alunos
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert turma_alunos"
  ON turma_alunos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete turma_alunos"
  ON turma_alunos
  FOR DELETE
  TO authenticated
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_turmas_updated_at BEFORE UPDATE ON turmas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_turmas_unit_numero ON turmas(unit, numero);
CREATE INDEX IF NOT EXISTS idx_turmas_status ON turmas(status);
CREATE INDEX IF NOT EXISTS idx_aulas_turma_data ON aulas(turma_id, data);
CREATE INDEX IF NOT EXISTS idx_turma_alunos_turma ON turma_alunos(turma_id);
CREATE INDEX IF NOT EXISTS idx_turma_alunos_student ON turma_alunos(student_id);

-- Inserir dados de exemplo
INSERT INTO turmas (unit, numero, valor, data_inicio, hora, duracao_meses, status) VALUES
('SP', 1, 150.00, '2025-01-15', '19:00', 6, 'em-andamento'),
('BH', 1, 120.00, '2025-02-01', '20:00', 6, 'planejada');

-- Comentários para documentação
COMMENT ON TABLE turmas IS 'Tabela de turmas do sistema';
COMMENT ON TABLE aulas IS 'Tabela de aulas das turmas';
COMMENT ON TABLE turma_alunos IS 'Relacionamento entre turmas e alunos';

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Sistema de turmas criado com sucesso:';
  RAISE NOTICE '- Tabela turmas criada';
  RAISE NOTICE '- Tabela aulas criada';
  RAISE NOTICE '- Tabela turma_alunos criada';
  RAISE NOTICE '- Políticas RLS configuradas';
  RAISE NOTICE '- Dados de exemplo inseridos';
END $$;