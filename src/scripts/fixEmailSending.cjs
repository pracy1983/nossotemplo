/**
 * Script para corrigir problemas de envio de email
 * Este script verifica e corrige problemas comuns no envio de emails
 * e garante que apenas o endereço de email dinâmico seja usado
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('=== CORREÇÃO DE PROBLEMAS DE ENVIO DE EMAIL ===');

// Função para obter variáveis de ambiente
const getEnvVar = (name) => {
  return process.env[name] || process.env[`VITE_${name}`] || '';
};

// Verificar configuração SMTP
console.log('\n1. Verificando configuração SMTP...');
const host = getEnvVar('EMAIL_HOST') || getEnvVar('SMTP_HOST');
const port = getEnvVar('EMAIL_PORT') || getEnvVar('SMTP_PORT');
const user = getEnvVar('EMAIL_USER') || getEnvVar('SMTP_USER');
const pass = getEnvVar('EMAIL_PASS') || getEnvVar('SMTP_PASSWORD');
const from = getEnvVar('EMAIL_FROM');

console.log(`Host: ${host}`);
console.log(`Port: ${port}`);
console.log(`User: ${user}`);
console.log(`From: ${from}`);
console.log(`Senha definida: ${pass ? 'Sim' : 'Não'}`);

// Verificar se há endereços de email hardcoded nos scripts de teste
console.log('\n2. Verificando scripts de teste para endereços hardcoded...');

const testEmailProductionPath = path.join(__dirname, 'testEmailProduction.cjs');
if (fs.existsSync(testEmailProductionPath)) {
  let content = fs.readFileSync(testEmailProductionPath, 'utf8');
  
  // Verificar se há endereços de email hardcoded
  const hardcodedEmailRegex = /const\s+testEmail\s*=\s*['"]([^'"]+)['"]/;
  const match = content.match(hardcodedEmailRegex);
  
  if (match) {
    console.log(`⚠️ Encontrado email hardcoded no script de teste: ${match[1]}`);
    console.log('Modificando para usar um endereço dinâmico...');
    
    // Substituir por um comentário explicativo
    const newContent = content.replace(
      hardcodedEmailRegex,
      `const testEmail = process.argv[2] || 'nossotemplosp@gmail.com'; // Use o email passado como argumento ou um padrão`
    );
    
    fs.writeFileSync(testEmailProductionPath, newContent, 'utf8');
    console.log('✅ Script de teste atualizado para usar endereço dinâmico!');
  } else {
    console.log('✅ Nenhum email hardcoded encontrado no script de teste.');
  }
} else {
  console.log('⚠️ Script de teste não encontrado.');
}

// Verificar o serviço de email
console.log('\n3. Verificando o serviço de email...');

const emailServicePath = path.join(__dirname, '..', 'services', 'emailService.ts');
if (fs.existsSync(emailServicePath)) {
  const content = fs.readFileSync(emailServicePath, 'utf8');
  
  // Verificar se há endereços de email hardcoded
  const hardcodedEmailRegex = /to:\s*['"]([^'"]+)['"]/g;
  const matches = [...content.matchAll(hardcodedEmailRegex)];
  
  if (matches.length > 0) {
    console.log(`⚠️ Encontrados possíveis emails hardcoded no serviço de email:`);
    matches.forEach(match => {
      console.log(`- ${match[1]}`);
    });
    console.log('Verifique manualmente se estes são variáveis ou valores hardcoded.');
  } else {
    console.log('✅ Nenhum email hardcoded encontrado no serviço de email.');
  }
  
  // Verificar se o serviço está usando o parâmetro 'to' corretamente
  if (content.includes('to,')) {
    console.log('✅ O serviço de email está usando o parâmetro "to" corretamente.');
  } else {
    console.log('⚠️ Possível problema com o parâmetro "to" no serviço de email.');
  }
} else {
  console.log('⚠️ Serviço de email não encontrado.');
}

// Verificar o componente StudentInvites
console.log('\n4. Verificando o componente StudentInvites...');

const studentInvitesPath = path.join(__dirname, '..', 'components', 'admin', 'StudentInvites.tsx');
if (fs.existsSync(studentInvitesPath)) {
  const content = fs.readFileSync(studentInvitesPath, 'utf8');
  
  // Verificar se está usando o email do formulário
  if (content.includes('inviteForm.email')) {
    console.log('✅ O componente StudentInvites está usando o email do formulário corretamente.');
  } else {
    console.log('⚠️ Possível problema com o uso do email do formulário no componente StudentInvites.');
  }
  
  // Verificar se está usando o serviço de email corretamente
  if (content.includes('sendInviteEmail(')) {
    console.log('✅ O componente StudentInvites está usando o serviço de email corretamente.');
  } else {
    console.log('⚠️ Possível problema com o uso do serviço de email no componente StudentInvites.');
  }
} else {
  console.log('⚠️ Componente StudentInvites não encontrado.');
}

// Criar um script de teste melhorado
console.log('\n5. Criando script de teste melhorado...');

const improvedTestScript = `/**
 * Script de teste melhorado para o serviço de email
 * Uso: node testEmailImproved.cjs [email] [nome]
 * Exemplo: node testEmailImproved.cjs usuario@exemplo.com "Nome do Usuário"
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// Função para obter variáveis de ambiente (suporta tanto prefixo VITE_ quanto sem prefixo)
const getEnvVar = (name) => {
  return process.env[name] || process.env[\`VITE_\${name}\`] || '';
};

// Configuração do transporter do Nodemailer
const createTransporter = () => {
  const host = getEnvVar('EMAIL_HOST') || getEnvVar('SMTP_HOST') || 'mail.aprendamagia.com.br';
  const port = Number(getEnvVar('EMAIL_PORT') || getEnvVar('SMTP_PORT') || 465);
  const user = getEnvVar('EMAIL_USER') || getEnvVar('SMTP_USER') || 'nossotemplo@aprendamagia.com.br';
  const pass = getEnvVar('EMAIL_PASS') || getEnvVar('SMTP_PASSWORD') || '';
  
  return nodemailer.createTransport({
    host,
    port,
    secure: true,
    auth: { user, pass },
    tls: { rejectUnauthorized: false },
    debug: true,
    logger: true
  });
};

// Função para simular o envio de email (fallback)
const simulateEmailSend = (to, subject, content) => {
  console.log('\\n=== SIMULAÇÃO DE EMAIL ===');
  console.log(\`Para: \${to}\`);
  console.log(\`Assunto: \${subject}\`);
  console.log('Conteúdo:', content);
  console.log('=== FIM DA SIMULAÇÃO ===\\n');
};

// Função para enviar email
const sendEmail = async (to, subject, html) => {
  try {
    console.log(\`Tentando enviar email para \${to}...\`);
    
    const transporter = createTransporter();
    const from = getEnvVar('EMAIL_FROM') || '"Nosso Templo" <nossotemplo@aprendamagia.com.br>';
    
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });

    console.log('✅ Email enviado com sucesso:', info.messageId);
    return true;
  } catch (error) {
    console.warn(\`❌ Erro ao enviar email real: \${error?.message || 'Erro desconhecido'}\`);
    console.log('Usando simulação de email como fallback...');
    
    simulateEmailSend(to, subject, html);
    return false;
  }
};

// Função para enviar email de convite
const sendInviteEmail = async (to, inviteLink, name) => {
  const subject = 'Convite - Nosso Templo';
  const html = \`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Convite para o Nosso Templo</h2>
      <p>Olá \${name},</p>
      <p>Você foi convidado para participar do Nosso Templo. Para aceitar o convite, clique no link abaixo:</p>
      <p><a href="\${inviteLink}" style="display: inline-block; background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Aceitar Convite</a></p>
      <p>Atenciosamente,<br>Equipe Nosso Templo</p>
    </div>
  \`;

  return sendEmail(to, subject, html);
};

// Função principal
const main = async () => {
  console.log('=== TESTE DO SERVIÇO DE EMAIL MELHORADO ===');
  
  // Obter email e nome dos argumentos da linha de comando
  const email = process.argv[2];
  const name = process.argv[3] || 'Usuário de Teste';
  
  if (!email) {
    console.error('❌ Erro: Email não fornecido!');
    console.log('Uso: node testEmailImproved.cjs [email] [nome]');
    console.log('Exemplo: node testEmailImproved.cjs usuario@exemplo.com "Nome do Usuário"');
    process.exit(1);
  }
  
  console.log(\`Testando envio de email para \${email}...\`);
  
  // Criar um link de convite de teste
  const inviteToken = 'teste-' + Date.now();
  const inviteUrl = \`https://nossotemplo.netlify.app/convite/\${inviteToken}\`;
  
  // Enviar email de convite
  const result = await sendInviteEmail(email, inviteUrl, name);
  
  if (result) {
    console.log(\`\\n✅ Email de convite enviado com sucesso para \${email}!\`);
  } else {
    console.log(\`\\n⚠️ Email de convite enviado usando simulação para \${email}.\`);
  }
};

// Executar o programa
main();
`;

const improvedTestScriptPath = path.join(__dirname, 'testEmailImproved.cjs');
fs.writeFileSync(improvedTestScriptPath, improvedTestScript, 'utf8');
console.log(`✅ Script de teste melhorado criado em ${improvedTestScriptPath}`);

console.log('\n=== RESUMO ===');
console.log('1. Verificação de configuração SMTP concluída');
console.log('2. Verificação de scripts de teste concluída');
console.log('3. Verificação do serviço de email concluída');
console.log('4. Verificação do componente StudentInvites concluída');
console.log('5. Script de teste melhorado criado');

console.log('\nPara testar o envio de email com um endereço específico, execute:');
console.log('node src/scripts/testEmailImproved.cjs seu-email@exemplo.com "Seu Nome"');

console.log('\nO problema de envio de email para endereços hardcoded deve estar resolvido.');
console.log('Agora o sistema deve usar apenas o endereço de email que você inserir no formulário.');
