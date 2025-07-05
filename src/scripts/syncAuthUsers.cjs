/**
 * Script para sincronizar usuários da tabela students com o Auth do Supabase
 * 
 * Este script:
 * 1. Busca todos os emails da tabela students
 * 2. Busca todos os usuários do Auth do Supabase
 * 3. Cria usuários Auth para emails que estão em students mas não em Auth
 * 4. Atualiza a tabela students com o auth_user_id para cada usuário
 * 5. Gera um relatório dos usuários processados
 * 
 * IMPORTANTE: Este script NÃO envia emails com senha. Os convites devem ser
 * enviados manualmente pelo sistema existente.
 * 
 * Uso: node syncAuthUsers.cjs [--report]
 * Opções:
 *   --report  Gera um arquivo CSV com o relatório dos usuários processados
 */

// Importações
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Verificar argumentos
const generateReport = process.argv.includes('--report');

// Configurações do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bmorgkxexennwmyxftgl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Verificar configurações
if (!supabaseServiceKey) {
  console.error('Erro: Variável de ambiente SUPABASE_SERVICE_ROLE_KEY não configurada!');
  console.error('Certifique-se de que SUPABASE_SERVICE_ROLE_KEY está definida no arquivo .env');
  process.exit(1);
}

console.log(`Usando Supabase URL: ${supabaseUrl}`);

// Criar cliente Supabase com service_role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

/**
 * Função principal para sincronizar usuários
 */
async function syncAuthUsers() {
  console.log('Iniciando sincronização de usuários...');
  
  try {
    // 1. Buscar todos os emails da tabela students
    console.log('Buscando emails da tabela students...');
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('id, email, full_name')
      .not('email', 'is', null)
      .neq('email', '');
    
    if (studentsError) {
      throw new Error(`Erro ao buscar estudantes: ${studentsError.message}`);
    }
    
    console.log(`Encontrados ${studentsData.length} estudantes com email válido.`);
    
    // 2. Buscar todos os usuários do Auth
    console.log('Buscando usuários do Auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Erro ao buscar usuários do Auth: ${authError.message}`);
    }
    
    const authEmails = new Map();
    authUsers.users.forEach(user => {
      authEmails.set(user.email.toLowerCase(), user.id);
    });
    
    console.log(`Encontrados ${authEmails.size} usuários no Auth.`);
    
    // 3. Identificar emails que estão em students mas não em Auth
    const missingUsers = studentsData.filter(student => {
      // Verificar se o email é válido
      if (!student.email || student.email.trim() === '') {
        return false;
      }
      
      // Verificar se o email já existe no Auth
      return !authEmails.has(student.email.toLowerCase());
    });
    
    console.log(`Encontrados ${missingUsers.length} estudantes sem usuário Auth`);
    
    // Verificar se há algo para processar
    if (missingUsers.length === 0) {
      console.log('\nTodos os estudantes já possuem usuários Auth. Nada a fazer.');
      return;
    }
    
    // 4. Verificar se a tabela students tem a coluna auth_user_id
    let hasAuthUserIdColumn = false;
    try {
      const { data: columnInfo } = await supabase
        .rpc('check_column_exists', { 
          table_name: 'students', 
          column_name: 'auth_user_id' 
        });
      
      hasAuthUserIdColumn = columnInfo;
    } catch (error) {
      console.warn('Não foi possível verificar se a coluna auth_user_id existe. Assumindo que não existe.');
      console.warn('Erro:', error.message);
    }
    
    // Se a coluna não existir, criar
    if (!hasAuthUserIdColumn) {
      console.log('Criando coluna auth_user_id na tabela students...');
      try {
        await supabase.rpc('add_auth_user_id_column');
        console.log('Coluna auth_user_id criada com sucesso!');
      } catch (error) {
        console.warn('Erro ao criar coluna auth_user_id:', error.message);
        console.warn('Tentando criar via SQL direto...');
        
        const { error: alterError } = await supabase.rpc('execute_sql', {
          sql_query: 'ALTER TABLE students ADD COLUMN IF NOT EXISTS auth_user_id UUID'
        });
        
        if (alterError) {
          console.error('Não foi possível criar a coluna auth_user_id:', alterError.message);
          console.error('Continuando sem vincular os IDs...');
        } else {
          console.log('Coluna auth_user_id criada com sucesso via SQL direto!');
        }
      }
    }
    
    // 5. Criar usuários Auth para emails faltantes
    console.log('Criando usuários Auth para emails faltantes...');
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    // Processando um por um para melhor controle de erros
    for (const student of missingUsers) {
      try {
        console.log(`Processando ${student.email} (${student.full_name})...`);
        
        // Verificar se o email é válido
        if (!student.email || !student.email.includes('@') || student.email.length < 5) {
          throw new Error('Email inválido');
        }
        
        // Gerar uma senha aleatória temporária (nunca será usada pois o usuário usará "esqueci a senha")
        const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2);
        
        // Criar usuário no Auth
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: student.email,
          password: tempPassword,
          email_confirm: true, // Confirmar email automaticamente
          user_metadata: { 
            full_name: student.full_name,
            source: 'sync_script',
            synced_at: new Date().toISOString()
          }
        });
        
        if (createError) {
          throw new Error(`Erro ao criar usuário Auth: ${createError.message}`);
        }
        
        console.log(`Usuário Auth criado com sucesso para ${student.email}`);
        
        // Atualizar a tabela students com o auth_user_id
        if (hasAuthUserIdColumn) {
          const { error: updateError } = await supabase
            .from('students')
            .update({ auth_user_id: newUser.user.id })
            .eq('id', student.id);
          
          if (updateError) {
            console.warn(`Aviso: Não foi possível atualizar auth_user_id para ${student.email}:`, updateError.message);
          } else {
            console.log(`ID do Auth vinculado ao estudante ${student.email}`);
          }
        }
        
        results.success++;
      } catch (error) {
        console.error(`Erro ao processar ${student.email}:`, error.message);
        results.failed++;
        results.errors.push({
          email: student.email,
          name: student.full_name,
          error: error.message
        });
      }
    }
    
    // 6. Exibir resumo
    console.log('\n===== RESUMO DA SINCRONIZAÇÃO =====');
    console.log(`Total de estudantes: ${studentsData.length}`);
    console.log(`Total de usuários Auth existentes: ${authEmails.size}`);
    console.log(`Estudantes sem usuário Auth: ${missingUsers.length}`);
    console.log(`Usuários criados com sucesso: ${results.success}`);
    console.log(`Falhas na criação: ${results.failed}`);
    
    if (results.errors.length > 0) {
      console.log('\n===== ERROS DETALHADOS =====');
      results.errors.forEach((err, index) => {
        console.log(`${index + 1}. ${err.email} (${err.name}): ${err.error}`);
      });
    }
    
    // 7. Gerar relatório se solicitado
    if (generateReport) {
      try {
        const reportDir = path.resolve(process.cwd(), 'reports');
        if (!fs.existsSync(reportDir)) {
          fs.mkdirSync(reportDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(reportDir, `sync-report-${timestamp}.csv`);
        
        // Cabeçalho do CSV
        let csvContent = 'Email,Nome,Status,Auth User ID,Erro\n';
        
        // Criar um mapa de usuários criados com seus IDs
        const createdUsers = new Map();
        
        // Buscar novamente os usuários do Auth para ter a lista atualizada
        try {
          const { data: updatedAuthUsers } = await supabase.auth.admin.listUsers();
          updatedAuthUsers.users.forEach(user => {
            createdUsers.set(user.email.toLowerCase(), user.id);
          });
        } catch (error) {
          console.warn('Aviso: Não foi possível obter a lista atualizada de usuários Auth');
        }
        
        // Adicionar usuários processados
        for (const student of missingUsers) {
          const authUserId = createdUsers.get(student.email.toLowerCase());
          const error = results.errors.find(e => e.email === student.email);
          
          csvContent += `"${student.email}","${student.full_name}",`;
          
          if (error) {
            csvContent += `"Falha","","${error.error.replace(/"/g, '""')}"\n`;
          } else {
            csvContent += `"Criado","${authUserId || ''}",""\n`;
          }
        }
        
        fs.writeFileSync(reportPath, csvContent, 'utf8');
        console.log(`\nRelatório gerado: ${reportPath}`);
      } catch (error) {
        console.error(`Erro ao gerar relatório: ${error.message}`);
      }
    }
    
    console.log('\nSincronização concluída!');
    console.log('IMPORTANTE: Os usuários foram criados SEM envio de emails.');
    console.log('Para enviar convites, use a funcionalidade existente no sistema.');
    
    if (!generateReport) {
      console.log('\nDica: Execute o script com a opção --report para gerar um relatório CSV:');
      console.log('node src/scripts/syncAuthUsers.cjs --report');
    }
    
  } catch (error) {
    console.error('Erro fatal durante a sincronização:', error.message);
    process.exit(1);
  }
}

// Executar a função principal
syncAuthUsers();
