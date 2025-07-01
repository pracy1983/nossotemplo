import { supabase } from '../lib/supabase';

export const checkSupabaseConnection = async () => {
  console.log('Verificando conexão com Supabase...');
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL ? 'Configurada' : 'Não configurada');
  console.log('Chave:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada');
  
  try {
    // Tenta fazer uma consulta simples para verificar a conexão
    const { data, error } = await supabase
      .from('students')
      .select('id')
      .limit(1);
      
    if (error) {
      console.error('Erro ao conectar com Supabase:', error.message);
      return {
        success: false,
        message: `Erro de conexão: ${error.message}`,
        error
      };
    }
    
    console.log('Conexão com Supabase bem-sucedida!');
    console.log('Dados retornados:', data);
    
    return {
      success: true,
      message: 'Conexão estabelecida com sucesso',
      data
    };
  } catch (err) {
    console.error('Exceção ao tentar conectar com Supabase:', err);
    return {
      success: false,
      message: `Exceção: ${err instanceof Error ? err.message : String(err)}`,
      error: err
    };
  }
};
