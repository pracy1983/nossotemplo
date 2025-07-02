/**
 * Configuração simplificada do Supabase para evitar erros de inicialização
 */
import { createClient } from '@supabase/supabase-js';

// Obter as variáveis de ambiente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar se as variáveis estão definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Variáveis de ambiente do Supabase não encontradas');
}

// Interface para o cliente simulado
interface MockClient {
  from: (table: string) => any;
  auth: {
    getUser: () => Promise<any>;
    signInWithPassword: (credentials: any) => Promise<any>;
    signOut: () => Promise<any>;
  };
}

// Cliente Supabase ou cliente simulado
let supabaseClient: any;

try {
  // Tentar criar o cliente Supabase com configuração mínima
  if (supabaseUrl && supabaseAnonKey) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true }
    });
    console.log('Cliente Supabase inicializado com sucesso');
  } else {
    throw new Error('Variáveis de ambiente ausentes');
  }
} catch (error) {
  console.error('Erro ao inicializar Supabase:', error);
  
  // Criar um cliente simulado em caso de erro
  supabaseClient = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
  } as MockClient;
  
  console.warn('Usando cliente Supabase simulado');
}

// Exportar o cliente
export const supabase = supabaseClient;

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