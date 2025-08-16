// Script de teste para autenticação com senha temporária (CommonJS)
const { createClient } = require('@supabase/supabase-js');

// Configuração do cliente Supabase com valores hardcoded para teste
const supabaseUrl = 'https://qqvnxnqkxdcxsqjvvhkb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxdm54bnFreGRjeHNxanZ2aGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDM3OTI1MzcsImV4cCI6MjAxOTM2ODUzN30.Yd_LbKFJkzVxXB_qdwJvWjP6-B8UM2JBGHnCm9VgSLo';

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para simular authenticateUser
async function authenticateUser(email, password) {
  try {
    console.log('Attempting authentication for:', email);
    
    // Primeiro verificar se existe um aluno com senha temporária
    console.log('Checking for student with temporary password first...');
    
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .eq('temp_password', password)
      .single();
    
    if (studentError) {
      if (studentError.code !== 'PGRST116') { // Não é erro "not found"
        console.error('Error checking for temporary password:', studentError);
        throw new Error(`Erro ao verificar senha temporária: ${studentError.message}`);
      }
      console.log('No student found with temporary password, trying normal authentication...');
    } else if (studentData) {
      console.log('Student found with matching temporary password!');
      console.log('Authentication successful with temporary password');
      return {
        id: studentData.id,
        email: studentData.email,
        name: studentData.full_name,
        authType: 'temp_password'
      };
    }
    
    // Se não encontrou com senha temporária, tenta autenticação normal
    console.log('Attempting normal Supabase Auth authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      console.error('Authentication error:', authError);
      throw new Error(`Erro de autenticação: ${authError.message}`);
    }
    
    console.log('Authentication successful with Supabase Auth');
    return {
      id: authData.user.id,
      email: authData.user.email,
      authType: 'supabase_auth'
    };
    
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}

// Testar com um email e senha específicos
async function runTest() {
  try {
    // Testar com um email e senha temporária específicos
    // Substitua por um email e senha temporária válidos do seu banco de dados
    const testEmail = 'teste@example.com';
    const tempPassword = 'Temp1234';
    
    console.log(`Testando autenticação para ${testEmail} com senha temporária ${tempPassword}`);
    
    try {
      const result = await authenticateUser(testEmail, tempPassword);
      console.log('Resultado da autenticação:', result);
    } catch (error) {
      console.log('Erro na autenticação (esperado se credenciais inválidas):', error.message);
    }
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

// Executar teste
console.log('Iniciando teste de autenticação...');
runTest().then(() => {
  console.log('Teste concluído');
}).catch(err => {
  console.error('Erro ao executar teste:', err);
});
