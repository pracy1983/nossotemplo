// Script de teste para autenticação com senha temporária
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do cliente Supabase
// Valores hardcoded para teste - em produção, use variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qqvnxnqkxdcxsqjvvhkb.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxdm54bnFreGRjeHNxanZ2aGtiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDM3OTI1MzcsImV4cCI6MjAxOTM2ODUzN30.Yd_LbKFJkzVxXB_qdwJvWjP6-B8UM2JBGHnCm9VgSLo';

if (!supabaseUrl || !supabaseKey) {
  console.error('Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são necessárias');
  process.exit(1);
}

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

// Testar com senha temporária
async function runTests() {
  try {
    // Buscar um usuário com senha temporária para teste
    const { data: testUser, error: userError } = await supabase
      .from('students')
      .select('email, temp_password')
      .not('temp_password', 'is', null)
      .limit(1)
      .single();
    
    if (userError) {
      console.error('Erro ao buscar usuário de teste:', userError);
      console.log('Criando usuário de teste com senha temporária...');
      
      // Criar usuário de teste com senha temporária
      const testEmail = 'teste_temp_' + Date.now() + '@example.com';
      const tempPassword = 'Temp' + Math.floor(Math.random() * 10000);
      
      const { data: newUser, error: createError } = await supabase
        .from('students')
        .insert({
          email: testEmail,
          full_name: 'Usuário de Teste',
          temp_password: tempPassword,
          role: 'student'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Erro ao criar usuário de teste:', createError);
        return;
      }
      
      console.log('Usuário de teste criado:', newUser.email, 'com senha temporária:', tempPassword);
      
      // Testar autenticação com senha temporária
      console.log('\n--- Teste de autenticação com senha temporária ---');
      const tempResult = await authenticateUser(newUser.email, tempPassword);
      console.log('Resultado da autenticação com senha temporária:', tempResult);
      
    } else {
      console.log('Usuário de teste encontrado:', testUser.email, 'com senha temporária:', testUser.temp_password);
      
      // Testar autenticação com senha temporária
      console.log('\n--- Teste de autenticação com senha temporária ---');
      const tempResult = await authenticateUser(testUser.email, testUser.temp_password);
      console.log('Resultado da autenticação com senha temporária:', tempResult);
    }
    
    // Testar com credenciais inválidas
    console.log('\n--- Teste de autenticação com credenciais inválidas ---');
    try {
      await authenticateUser('usuario_inexistente@example.com', 'senha_incorreta');
    } catch (error) {
      console.log('Erro esperado com credenciais inválidas:', error.message);
    }
    
  } catch (error) {
    console.error('Erro nos testes:', error);
  }
}

// Executar testes
runTests().then(() => {
  console.log('Testes concluídos');
}).catch(err => {
  console.error('Erro ao executar testes:', err);
});
