/**
 * Implementação Singleton do cliente Supabase
 * Este arquivo centraliza toda a lógica de inicialização e gerenciamento do cliente Supabase
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { MockSupabaseClient } from './supabaseMock';
import { createMockClient } from './supabaseMock';

// Configuração de retry
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

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
  private _client: SupabaseClient | MockSupabaseClient | null = null;
  private _isInitializing: boolean = false;
  private _initPromise: Promise<SupabaseClient | MockSupabaseClient> | null = null;
  private _retryCount: number = 0;
  private _isMockClient: boolean = false;

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
   * Verifica se o cliente está usando a implementação mock
   */
  public get isMockClient(): boolean {
    return this._isMockClient;
  }

  /**
   * Obtém o cliente Supabase, inicializando-o se necessário
   */
  public async getClient(): Promise<SupabaseClient | MockSupabaseClient> {
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
   * Retorna o cliente mock se o cliente real ainda não estiver inicializado
   */
  public getClientSync(): SupabaseClient | MockSupabaseClient {
    if (this._client) {
      return this._client;
    }
    
    // Se o cliente não estiver inicializado, retorna um cliente mock temporário
    // e inicia a inicialização em background se ainda não estiver em andamento
    if (!this._isInitializing && !this._initPromise) {
      this._initPromise = this.initializeClient();
    }
    
    // Verificar se as variáveis de ambiente estão definidas
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Se as variáveis de ambiente estão definidas, tentar criar o cliente real
    if (supabaseUrl && supabaseAnonKey) {
      try {
        const client = createClient<DatabaseTypes>(supabaseUrl, supabaseAnonKey, {
          auth: { 
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true // Importante para detectar tokens na URL
          }
        });
        
        this._client = client;
        this._isMockClient = false;
        console.log('Cliente Supabase inicializado sincronamente');
        return client;
      } catch (error) {
        console.error('Erro ao inicializar Supabase sincronamente:', error);
      }
    }
    
    // Se não conseguir criar o cliente real, retorna um cliente mock temporário
    console.warn('Usando cliente mock temporário enquanto aguarda inicialização do cliente real');
    this._isMockClient = true;
    return createMockClient();
  }

  /**
   * Inicializa o cliente Supabase com retry e timeout
   */
  private async initializeClient(): Promise<SupabaseClient | MockSupabaseClient> {
    if (this._isInitializing) {
      throw new Error('Cliente já está sendo inicializado');
    }

    this._isInitializing = true;
    
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
      
      // Criar o cliente com configuração completa para autenticação
      const client = createClient<DatabaseTypes>(supabaseUrl, supabaseAnonKey, {
        auth: { 
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true // Importante para detectar tokens na URL
        }
      });
      
      // Testar a conexão para garantir que o cliente foi inicializado corretamente
      const { error } = await client
        .from('students')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        throw new Error(`Erro ao testar conexão: ${error.message}`);
      }
      
      // Cliente inicializado com sucesso
      this._client = client;
      this._isMockClient = false;
      console.log('Cliente Supabase inicializado com sucesso');
      
      return client;
    } catch (error) {
      console.error('Erro ao inicializar Supabase:', error);
      
      // Implementar lógica de retry com backoff exponencial
      if (this._retryCount < MAX_RETRY_ATTEMPTS) {
        this._retryCount++;
        const delayMs = RETRY_DELAY_MS * Math.pow(2, this._retryCount - 1);
        
        console.log(`Tentando novamente em ${delayMs}ms (tentativa ${this._retryCount}/${MAX_RETRY_ATTEMPTS})`);
        
        // Resetar o estado de inicialização para permitir nova tentativa
        this._isInitializing = false;
        this._initPromise = null;
        
        // Esperar antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // Tentar novamente
        return this.getClient();
      }
      
      // Se todas as tentativas falharem, usar o cliente mock
      console.warn('Todas as tentativas de inicialização falharam. Usando cliente mock.');
      this._isMockClient = true;
      this._client = createMockClient();
      return this._client;
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
    this._retryCount = 0;
    this._isMockClient = false;
  }
}

// Exportar uma instância do cliente para uso em toda a aplicação
export const supabaseManager = SupabaseManager.getInstance();

// Exportar um getter para o cliente que pode ser usado de forma síncrona
// mas que tentará inicializar o cliente real em background
export const supabase = supabaseManager.getClientSync();

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
