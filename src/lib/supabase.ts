/**
 * Configuração do Supabase com solução de contorno para o erro de classe
 */
import { createMockClient } from './supabaseMock';

// Declaração do cliente Supabase
let supabase: any;

// Função para inicializar o Supabase de forma segura
const initSupabase = async () => {
  try {
    // Obter as variáveis de ambiente
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Supabase Environment Check:');
    console.log('URL:', supabaseUrl ? 'Present' : 'Missing');
    console.log('Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');
    
    // Verificar se as variáveis estão definidas
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Variáveis de ambiente do Supabase não encontradas');
    }
    
    // Importação dinâmica para evitar erros de inicialização
    const { createClient } = await import('@supabase/supabase-js');
    
    // Criar o cliente com configuração mínima
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true }
    });
  } catch (error) {
    console.error('Erro ao inicializar Supabase:', error);
    return createMockClient();
  }
};

// Inicializar o cliente como um cliente simulado primeiro
supabase = createMockClient();

// Tentar inicializar o cliente real de forma assíncrona
initSupabase().then(client => {
  // Se a inicialização for bem-sucedida, substituir o cliente simulado
  supabase = client;
  console.log('Cliente Supabase inicializado com sucesso');
}).catch(error => {
  console.error('Falha ao inicializar Supabase:', error);
  console.warn('Continuando com o cliente simulado');
});

// Exportar o cliente
export { supabase };

// Database types
export interface DatabaseStudent {
  id: string;
  photo?: string;
  full_name: string;
  birth_date: string | null;
  cpf?: string;
  rg?: string;
  email: string;
  phone?: string;
  religion?: string;
  unit: 'SP' | 'BH' | 'CP';
  development_start_date?: string | null;
  internship_start_date?: string | null;
  magist_initiation_date?: string | null;
  not_entry_date?: string | null;
  master_magus_initiation_date?: string | null;
  is_founder: boolean;
  is_active: boolean;
  inactive_since?: string | null;
  last_activity?: string | null;
  is_admin: boolean;
  is_guest: boolean;
  created_at: string;
  updated_at: string;
  // Address fields
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  // Group/Class field
  turma?: string;
  // Invite and approval fields
  is_pending_approval?: boolean;
  invite_status?: 'pending' | 'accepted' | 'expired';
  invite_token?: string;
  invited_at?: string;
  invited_by?: string;
}

export interface DatabaseEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  description?: string;
  location: string;
  unit: 'SP' | 'BH' | 'CP';
  created_at: string;
  updated_at: string;
}

export interface DatabaseAttendanceRecord {
  id: string;
  student_id: string;
  date: string;
  type: 'development' | 'work' | 'monthly' | 'event';
  event_id?: string;
  created_at: string;
}

export interface DatabaseEventAttendee {
  id: string;
  event_id: string;
  student_id: string;
  created_at: string;
}