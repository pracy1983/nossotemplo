import { supabase } from './supabase';

export const signIn = async (email: string, password: string) => {
  console.log('Tentando login com:', email); // Debug

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Erro de login:', error.message);
    throw error;
  }

  console.log('Login bem sucedido:', data); // Debug
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
};