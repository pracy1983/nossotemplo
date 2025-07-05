/**
 * Script para configurar a service_role key no arquivo .env
 * 
 * Este script adiciona a SUPABASE_SERVICE_ROLE_KEY ao arquivo .env
 * se ela ainda não estiver presente.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.resolve(process.cwd(), '.env');

// Função para verificar se a chave já existe no arquivo .env
function checkIfKeyExists(envContent) {
  return envContent.includes('SUPABASE_SERVICE_ROLE_KEY=');
}

// Função para adicionar a chave ao arquivo .env
function addKeyToEnv(serviceRoleKey) {
  try {
    // Ler o conteúdo atual do arquivo .env
    let envContent = '';
    try {
      envContent = fs.readFileSync(envPath, 'utf8');
    } catch (error) {
      console.warn('Arquivo .env não encontrado. Criando um novo arquivo.');
    }

    // Verificar se a chave já existe
    if (checkIfKeyExists(envContent)) {
      console.log('A chave SUPABASE_SERVICE_ROLE_KEY já existe no arquivo .env.');
      return;
    }

    // Adicionar a chave ao arquivo
    const newEnvContent = envContent + 
      (envContent.endsWith('\n') ? '' : '\n') + 
      `\n# Supabase Service Role Key (adicionado pelo script de sincronização)\n` +
      `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}\n`;

    // Salvar o arquivo
    fs.writeFileSync(envPath, newEnvContent, 'utf8');
    console.log('Chave SUPABASE_SERVICE_ROLE_KEY adicionada com sucesso ao arquivo .env.');
  } catch (error) {
    console.error('Erro ao adicionar a chave ao arquivo .env:', error.message);
    process.exit(1);
  }
}

// Função principal
async function main() {
  console.log('Configurando a service_role key do Supabase...');

  // Verificar se a chave foi fornecida como argumento
  const serviceRoleKey = process.argv[2];

  if (!serviceRoleKey) {
    console.error('Erro: Forneça a service_role key como argumento.');
    console.error('Uso: node setup_env.cjs <sua_service_role_key>');
    process.exit(1);
  }

  // Adicionar a chave ao arquivo .env
  addKeyToEnv(serviceRoleKey);

  console.log('\nConfiguração concluída!');
  console.log('Agora você pode executar o script de sincronização:');
  console.log('node src/scripts/syncAuthUsers.cjs');
}

// Executar a função principal
main();
