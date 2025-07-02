import { createClient } from '@supabase/supabase-js';

// Obtenha as variáveis de ambiente ou use valores padrão para desenvolvimento
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sua-url-supabase.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'sua-chave-anon-key';

// Criar o cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);

// Função auxiliar para verificar a conexão com o Supabase
export const checkConnection = async () => {
  try {
    const { error } = await supabase.from('students').select('count', { count: 'exact' }).limit(1);
    
    if (error) {
      throw new Error(error.message);
    }
    
    return { success: true, message: 'Conexão com Supabase estabelecida com sucesso' };
  } catch (error) {
    return { 
      success: false, 
      message: 'Falha ao conectar com Supabase', 
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
