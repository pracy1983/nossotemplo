/**
 * Cliente Supabase simulado para uso quando o cliente real falhar
 */

// Interface para o cliente simulado
export interface MockSupabaseClient {
  from: (table: string) => any;
  auth: {
    getUser: () => Promise<any>;
    signInWithPassword: (credentials: any) => Promise<any>;
    signOut: () => Promise<any>;
  };
}

// Criar um cliente simulado
export const createMockClient = (): MockSupabaseClient => {
  console.warn('Usando cliente Supabase simulado');
  
  return {
    from: (_table: string) => ({
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
  };
};
