/*
  # Schema inicial para o Sistema Nosso Templo

  1. Novas Tabelas
    - `students`
      - `id` (uuid, primary key)
      - `photo` (text, URL da foto)
      - `full_name` (text)
      - `birth_date` (date)
      - `cpf` (text)
      - `rg` (text)
      - `email` (text, unique)
      - `phone` (text)
      - `religion` (text)
      - `unit` (text, 'SP' ou 'BH')
      - `development_start_date` (date)
      - `internship_start_date` (date)
      - `magist_initiation_date` (date)
      - `not_entry_date` (date)
      - `master_magus_initiation_date` (date)
      - `is_founder` (boolean)
      - `is_active` (boolean)
      - `inactive_since` (date)
      - `last_activity` (date)
      - `is_admin` (boolean)
      - `is_guest` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `date` (date)
      - `time` (text)
      - `description` (text)
      - `location` (text)
      - `unit` (text, 'SP' ou 'BH')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `attendance_records`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `date` (date)
      - `type` (text, 'development', 'work', 'monthly', 'event')
      - `event_id` (uuid, foreign key, opcional)
      - `created_at` (timestamp)

    - `event_attendees`
      - `id` (uuid, primary key)
      - `event_id` (uuid, foreign key)
      - `student_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados
*/

-- Criar tabela de estudantes
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo text,
  full_name text NOT NULL,
  birth_date date NOT NULL,
  cpf text,
  rg text,
  email text UNIQUE NOT NULL,
  phone text,
  religion text,
  unit text NOT NULL CHECK (unit IN ('SP', 'BH')),
  development_start_date date,
  internship_start_date date,
  magist_initiation_date date,
  not_entry_date date,
  master_magus_initiation_date date,
  is_founder boolean DEFAULT false,
  is_active boolean DEFAULT true,
  inactive_since date,
  last_activity date,
  is_admin boolean DEFAULT false,
  is_guest boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de eventos
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date date NOT NULL,
  time text NOT NULL,
  description text,
  location text NOT NULL,
  unit text NOT NULL CHECK (unit IN ('SP', 'BH')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de registros de presença
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('development', 'work', 'monthly', 'event')),
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de participantes de eventos
CREATE TABLE IF NOT EXISTS event_attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES events(id) ON DELETE CASCADE,
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, student_id)
);

-- Habilitar RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

-- Políticas para students
CREATE POLICY "Usuários autenticados podem ver todos os estudantes"
  ON students
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir estudantes"
  ON students
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar estudantes"
  ON students
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar estudantes"
  ON students
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para events
CREATE POLICY "Usuários autenticados podem ver todos os eventos"
  ON events
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir eventos"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar eventos"
  ON events
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar eventos"
  ON events
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para attendance_records
CREATE POLICY "Usuários autenticados podem ver registros de presença"
  ON attendance_records
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir registros de presença"
  ON attendance_records
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar registros de presença"
  ON attendance_records
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem deletar registros de presença"
  ON attendance_records
  FOR DELETE
  TO authenticated
  USING (true);

-- Políticas para event_attendees
CREATE POLICY "Usuários autenticados podem ver participantes de eventos"
  ON event_attendees
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir participantes de eventos"
  ON event_attendees
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar participantes de eventos"
  ON event_attendees
  FOR DELETE
  TO authenticated
  USING (true);

-- Inserir dados iniciais
INSERT INTO students (
  full_name, birth_date, cpf, rg, email, phone, religion, unit,
  development_start_date, internship_start_date, magist_initiation_date,
  not_entry_date, is_founder, is_active, last_activity, is_admin, is_guest
) VALUES 
(
  'João da Silva Santos', '1985-03-15', '123.456.789-01', '12.345.678-9',
  'joao.silva@email.com', '(11) 99999-9999', 'Espiritualista', 'SP',
  '2020-01-15', '2021-06-01', '2022-12-15', '2023-03-01',
  true, true, '2024-01-10', false, false
),
(
  'Maria Santos Oliveira', '1990-07-22', '987.654.321-01', '98.765.432-1',
  'maria.santos@email.com', '(31) 88888-8888', 'Católica', 'BH',
  '2021-05-10', '2022-08-01', null, null,
  false, true, '2024-01-12', false, false
),
(
  'Pedro Costa Lima', '1988-11-05', '456.789.123-01', '45.678.912-3',
  'pedro.costa@email.com', '(11) 77777-7777', 'Umbandista', 'SP',
  '2019-03-20', null, null, null,
  false, false, '2023-07-10', false, false
),
(
  'Paula Racy', '1980-01-01', '111.111.111-11', '11.111.111-1',
  'paularacy@gmail.com', '(11) 11111-1111', 'Administradora', 'SP',
  null, null, null, null,
  true, true, now()::date, true, false
);

-- Inserir eventos iniciais
INSERT INTO events (title, date, time, description, location, unit) VALUES
('Desenvolvimento Espiritual', '2024-01-15', '19:00', 'Sessão de desenvolvimento mediúnico', 'Sala Principal', 'SP'),
('Trabalho de Caridade', '2024-01-20', '14:00', 'Distribuição de alimentos', 'Área Externa', 'BH'),
('Palestra Doutrinária', '2024-01-25', '20:00', 'Estudo da doutrina espírita', 'Auditório', 'SP');

-- Inserir registros de presença
INSERT INTO attendance_records (student_id, date, type) 
SELECT s.id, '2024-01-10', 'development' FROM students s WHERE s.email = 'joao.silva@email.com';

INSERT INTO attendance_records (student_id, date, type) 
SELECT s.id, '2024-01-15', 'monthly' FROM students s WHERE s.email = 'joao.silva@email.com';

INSERT INTO attendance_records (student_id, date, type) 
SELECT s.id, '2024-01-20', 'work' FROM students s WHERE s.email = 'joao.silva@email.com';

INSERT INTO attendance_records (student_id, date, type) 
SELECT s.id, '2024-01-12', 'development' FROM students s WHERE s.email = 'maria.santos@email.com';

INSERT INTO attendance_records (student_id, date, type) 
SELECT s.id, '2024-01-18', 'event' FROM students s WHERE s.email = 'maria.santos@email.com';

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();