/**
 * Implementação Singleton do cliente Supabase
 * Este arquivo centraliza toda a lógica de inicialização e gerenciamento do cliente Supabase
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Interface para o cliente Supabase com tipos
export interface DatabaseTypes {
  public: {
    Tables: {
      students: {
        Row: {
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
          street?: string;
          number?: string;
          complement?: string;
          neighborhood?: string;
          zip_code?: string;
          city?: string;
          state?: string;
          turma?: string;
          is_pending_approval?: boolean;
          invite_status?: 'pending' | 'accepted' | 'expired';
          invite_token?: string;
          invited_at?: string;
          invited_by?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          date: string;
          time: string;
          description?: string;
          location: string;
          unit: 'SP' | 'BH' | 'CP';
          created_at: string;
          updated_at: string;
        };
      };
      attendance_records: {
        Row: {
          id: string;
          student_id: string;
          date: string;
          type: 'development' | 'work' | 'monthly' | 'event';
          event_id?: string;
          created_at: string;
        };
      };
    };
  };
};

/**
 * Classe Singleton para gerenciar o cliente Supabase
 */
class SupabaseManager {
  private static instance: SupabaseManager;
  private _client: SupabaseClient | null = null;
  private _initPromise: Promise<SupabaseClient> | null = null;
  private _isInitializing: boolean = false;

  private constructor() {
    // Construtor privado para garantir o padrão Singleton
  }

  /**
   * Obtém a instância única do SupabaseManager
   */
  public static getInstance(): SupabaseManager {
    if (!SupabaseManager.instance) {
      SupabaseManager.instance = new SupabaseManager();
    }
    return SupabaseManager.instance;
  }

  /**
   * Verifica se o cliente está inicializado
   */
  public get isInitialized(): boolean {
    return this._client !== null;
  }

  /**
   * Obtém o cliente Supabase, inicializando-o se necessário
   */
  public async getClient(): Promise<SupabaseClient> {
    if (this._client) {
      return this._client;
    }

    if (this._initPromise) {
      return this._initPromise;
    }

    this._initPromise = this.initializeClient();
    return this._initPromise;
  }

  /**
   * Obtém o cliente Supabase de forma síncrona
   */
  public getClientSync(): SupabaseClient {
    if (this._client) {
      return this._client;
    }
    
    // Inicializar o cliente Supabase imediatamente
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('ERRO CRÍTICO: Variáveis de ambiente do Supabase não definidas!');
      console.error('VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas');
      throw new Error('Configuração do Supabase incompleta. Verifique as variáveis de ambiente.');
    }
    
    try {
      // Criar cliente real imediatamente
      this._client = createClient(supabaseUrl, supabaseAnonKey);
      console.log('Cliente Supabase inicializado com sucesso');
      return this._client;
    } catch (error) {
      console.error('Erro fatal ao inicializar cliente Supabase:', error);
      throw new Error('Falha ao inicializar cliente Supabase. Verifique a conexão e as credenciais.');
    }
  }

  /**
   * Inicializa o cliente Supabase com retry e timeout
   */
  private async initializeClient(): Promise<SupabaseClient> {
    if (this._client) {
      return this._client;
    }

    this._isInitializing = true;

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Variáveis de ambiente do Supabase não definidas');
      }
      
      console.log('Inicializando cliente Supabase...');
      
      // Criar o cliente Supabase
      const client = createClient(supabaseUrl, supabaseAnonKey);
      
      // Testar a conexão
      const { error } = await client
        .from('students')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        throw new Error(`Erro ao testar conexão: ${error.message}`);
      }
      
      console.log('Cliente Supabase inicializado com sucesso');
      
      this._client = client;
      return client;
    } catch (error) {
      console.error('ERRO FATAL ao inicializar Supabase:', error);
      throw new Error(`Falha ao conectar com Supabase: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this._isInitializing = false;
    }
  }

  /**
   * Reseta o cliente para forçar uma nova inicialização
   */
  public resetClient(): void {
    this._client = null;
    this._initPromise = null;
    this._isInitializing = false;
  }
}

// Exportar uma instância do cliente para uso em toda a aplicação
export const supabaseManager = SupabaseManager.getInstance();

// Função auxiliar para obter o cliente Supabase de forma assíncrona
export const getSupabaseClient = async () => {
  return await supabaseManager.getClient();
};

// Função para verificar a conexão com o Supabase
export const checkSupabaseConnection = async (): Promise<{ 
  success: boolean; 
  message: string; 
  data?: any; 
  error?: any;
}> => {
  try {
    // Tentar obter o cliente real
    const client = await supabaseManager.getClient();
    
    // Testar a conexão
    const { data, error } = await client
      .from('students')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      return {
        success: false,
        message: `Erro ao testar conexão: ${error.message}`,
        error
      };
    }
    
    return {
      success: true,
      message: 'Conexão com Supabase estabelecida com sucesso',
      data
    };
  } catch (error) {
    return {
      success: false,
      message: `Falha ao conectar com Supabase: ${error instanceof Error ? error.message : String(error)}`,
      error
    };
  }
};

// Exportar interfaces de tipos do banco de dados para uso em outros arquivos
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
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  zip_code?: string;
  city?: string;
  state?: string;
  turma?: string;
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
