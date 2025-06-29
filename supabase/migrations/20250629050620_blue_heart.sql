/*
  # Adicionar Templo Campinas e corrigir eventos

  1. Templos
    - Adicionar Templo Campinas (CP) na lista de unidades válidas
    - Atualizar constraints para aceitar CP

  2. Eventos
    - Adicionar campos para tipo, cor, visibilidade e repetição
    - Atualizar constraint de unidade para incluir CP

  3. Dados
    - Inserir Templo Campinas
    - Atualizar eventos existentes com cores corretas
*/

-- Primeiro, remover a constraint de unidade existente para students
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_unit_check;

-- Adicionar nova constraint que inclui CP
ALTER TABLE students ADD CONSTRAINT students_unit_check 
  CHECK (unit IN ('SP', 'BH', 'CP'));

-- Remover a constraint de unidade existente para events
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_unit_check;

-- Adicionar nova constraint que inclui CP
ALTER TABLE events ADD CONSTRAINT events_unit_check 
  CHECK (unit IN ('SP', 'BH', 'CP'));

-- Adicionar novos campos na tabela events se não existirem
DO $$
BEGIN
  -- Adicionar campo type se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'type'
  ) THEN
    ALTER TABLE events ADD COLUMN type text DEFAULT 'outro';
  END IF;

  -- Adicionar campo color se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'color'
  ) THEN
    ALTER TABLE events ADD COLUMN color text DEFAULT '#EC4899';
  END IF;

  -- Adicionar campo visibility se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'visibility'
  ) THEN
    ALTER TABLE events ADD COLUMN visibility jsonb DEFAULT '["todos"]';
  END IF;

  -- Adicionar campo repetition se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'repetition'
  ) THEN
    ALTER TABLE events ADD COLUMN repetition text DEFAULT 'none';
  END IF;

  -- Adicionar campo repeat_until se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'repeat_until'
  ) THEN
    ALTER TABLE events ADD COLUMN repeat_until date;
  END IF;

  -- Adicionar campo parent_event_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'parent_event_id'
  ) THEN
    ALTER TABLE events ADD COLUMN parent_event_id uuid REFERENCES events(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Inserir Templo Campinas se não existir
INSERT INTO temples (
  id,
  name,
  city,
  abbreviation,
  address,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Templo da Luz Divina',
  'Campinas',
  'CP',
  'Campinas, São Paulo',
  true,
  now(),
  now()
) ON CONFLICT (abbreviation) DO NOTHING;

-- Atualizar eventos existentes com tipos e cores corretas
UPDATE events SET 
  type = CASE 
    WHEN LOWER(title) LIKE '%workshop%' THEN 'workshop'
    WHEN LOWER(title) LIKE '%ritual%' OR LOWER(title) LIKE '%coletivo%' THEN 'ritual-coletivo'
    WHEN LOWER(title) LIKE '%rito%' OR LOWER(title) LIKE '%aberto%' THEN 'rito-aberto'
    WHEN LOWER(title) LIKE '%desenvolvimento%' OR LOWER(title) LIKE '%mágick%' OR LOWER(title) LIKE '%mediunic%' THEN 'desenvolvimento-magicko'
    WHEN LOWER(title) LIKE '%n.o.t%' OR LOWER(title) LIKE '%not%' THEN 'not'
    WHEN LOWER(title) LIKE '%reunião%' OR LOWER(title) LIKE '%reuniao%' THEN 'reuniao'
    ELSE 'outro'
  END,
  color = CASE 
    WHEN LOWER(title) LIKE '%workshop%' THEN '#3B82F6'
    WHEN LOWER(title) LIKE '%ritual%' OR LOWER(title) LIKE '%coletivo%' THEN '#8B5CF6'
    WHEN LOWER(title) LIKE '%rito%' OR LOWER(title) LIKE '%aberto%' THEN '#10B981'
    WHEN LOWER(title) LIKE '%desenvolvimento%' OR LOWER(title) LIKE '%mágick%' OR LOWER(title) LIKE '%mediunic%' THEN '#F59E0B'
    WHEN LOWER(title) LIKE '%n.o.t%' OR LOWER(title) LIKE '%not%' THEN '#DC2626'
    WHEN LOWER(title) LIKE '%reunião%' OR LOWER(title) LIKE '%reuniao%' THEN '#6B7280'
    ELSE '#EC4899'
  END,
  visibility = '["todos"]',
  repetition = 'none'
WHERE type IS NULL OR type = 'outro';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_unit_date ON events(unit, date);
CREATE INDEX IF NOT EXISTS idx_events_parent ON events(parent_event_id) WHERE parent_event_id IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN events.type IS 'Tipo do evento: workshop, ritual-coletivo, rito-aberto, desenvolvimento-magicko, not, reuniao, outro';
COMMENT ON COLUMN events.color IS 'Cor hexadecimal para exibição no calendário';
COMMENT ON COLUMN events.visibility IS 'Array JSON com níveis de visibilidade: alunos, iniciados, mestres, diretores, fundadores, todos';
COMMENT ON COLUMN events.repetition IS 'Tipo de repetição: none, daily, weekly, biweekly, monthly, yearly';
COMMENT ON COLUMN events.repeat_until IS 'Data limite para repetição (opcional)';
COMMENT ON COLUMN events.parent_event_id IS 'ID do evento pai para eventos recorrentes';

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE 'Migração concluída com sucesso:';
  RAISE NOTICE '- Templo Campinas (CP) adicionado';
  RAISE NOTICE '- Constraints de unidade atualizadas';
  RAISE NOTICE '- Campos de eventos adicionados';
  RAISE NOTICE '- Eventos existentes atualizados com cores corretas';
END $$;