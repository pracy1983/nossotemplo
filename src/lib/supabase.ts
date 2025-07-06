/**
 * Este arquivo agora importa o cliente Supabase do supabaseClient.ts
 * para evitar múltiplas instâncias do cliente Supabase na aplicação.
 * 
 * IMPORTANTE: Todas as referências ao cliente Supabase devem usar esta importação
 * para garantir que apenas uma instância do cliente seja usada em toda a aplicação.
 */
import { supabase } from './supabaseClient';

// Re-exportar o cliente para manter compatibilidade com código existente
export { supabase };