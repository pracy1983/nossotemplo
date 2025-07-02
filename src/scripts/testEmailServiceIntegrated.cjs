/**
 * Script de teste integrado para o serviço de email
 * Este script testa o serviço de email com todas as funcionalidades implementadas:
 * - Envio de email real com fallback para simulação
 * - Envio de email de convite
 * - Envio de email de redefinição de senha
 */

require('dotenv').config();

// Função para obter variáveis de ambiente (suporta tanto prefixo VITE_ quanto sem prefixo)
const getEnvVar = (name) => {
  return process.env[name] || process.env[`VITE_${name}`] || '';
};

// Função para simular o envio de email (fallback)
const simulateEmailSend = (to, subject, content) => {
  console.log('\n=== SIMULAÇÃO DE EMAIL ===');
  console.log(`Para: ${to}`);
  console.log(`Assunto: ${subject}`);
  console.log('Conteúdo:', content);
  console.log('=== FIM DA SIMULAÇÃO ===\n');
};

// Configuração do transporter do Nodemailer
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: getEnvVar('EMAIL_HOST') || getEnvVar('SMTP_HOST') || 'mail.aprendamagia.com.br',
  port: Number(getEnvVar('EMAIL_PORT') || getEnvVar('SMTP_PORT') || 465),
  secure: true, // true para porta 465, false para outras portas
  auth: {
    user: getEnvVar('EMAIL_USER') || getEnvVar('SMTP_USER') || 'nossotemplo@aprendamagia.com.br',
    pass: getEnvVar('EMAIL_PASS') || getEnvVar('SMTP_PASSWORD') || ''
  },
  tls: {
    // Não verificar certificado para evitar problemas com certificados autoassinados
    rejectUnauthorized: false
  }
});

// Função para enviar email com fallback para simulação
const sendEmail = async (to, subject, html) => {
  try {
    console.log(`Tentando enviar email para ${to}...`);
    
    const info = await transporter.sendMail({
      from: getEnvVar('EMAIL_FROM') || '"Nosso Templo" <nossotemplo@aprendamagia.com.br>',
      to,
      subject,
      html
    });

    console.log('✅ Email enviado com sucesso:', info.messageId);
    return true;
  } catch (error) {
    console.warn(`❌ Erro ao enviar email real: ${error?.message || 'Erro desconhecido'}`);
    console.log('Usando simulação de email como fallback...');
    
    // Usar simulação como fallback
    simulateEmailSend(to, subject, html);
    return true; // Retorna true mesmo com simulação para não interromper o fluxo da aplicação
  }
};

// Função para enviar email de redefinição de senha
const sendPasswordResetEmail = async (to, resetLink, name) => {
  const subject = 'Redefinição de Senha - Nosso Templo';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Redefinição de Senha</h2>
      <p>Olá ${name},</p>
      <p>Você foi cadastrado no sistema Nosso Templo. Para definir sua senha, clique no link abaixo:</p>
      <p><a href="${resetLink}" style="display: inline-block; background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Definir Senha</a></p>
      <p>Se você não solicitou esta redefinição, por favor ignore este email.</p>
      <p>Atenciosamente,<br>Equipe Nosso Templo</p>
    </div>
  `;

  return sendEmail(to, subject, html);
};

// Função para enviar convite para novos membros
const sendInviteEmail = async (to, inviteLink, name) => {
  const subject = 'Convite - Nosso Templo';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Convite para o Nosso Templo</h2>
      <p>Olá ${name},</p>
      <p>Você foi convidado para participar do Nosso Templo. Para aceitar o convite, clique no link abaixo:</p>
      <p><a href="${inviteLink}" style="display: inline-block; background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Aceitar Convite</a></p>
      <p>Atenciosamente,<br>Equipe Nosso Templo</p>
    </div>
  `;

  return sendEmail(to, subject, html);
};

// Função principal para executar os testes
const runTests = async () => {
  console.log('=== TESTE DO SERVIÇO DE EMAIL INTEGRADO ===');
  
  // Mostrar configurações
  const host = getEnvVar('EMAIL_HOST') || getEnvVar('SMTP_HOST') || 'mail.aprendamagia.com.br';
  const port = getEnvVar('EMAIL_PORT') || getEnvVar('SMTP_PORT') || 465;
  const user = getEnvVar('EMAIL_USER') || getEnvVar('SMTP_USER') || 'nossotemplo@aprendamagia.com.br';
  const from = getEnvVar('EMAIL_FROM') || '"Nosso Templo" <nossotemplo@aprendamagia.com.br>';
  const pass = getEnvVar('EMAIL_PASS') || getEnvVar('SMTP_PASSWORD') || '';
  
  console.log('Configurações:');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`From: ${from}`);
  console.log(`Senha definida: ${pass ? 'Sim' : 'Não'}`);
  console.log(`Senha começa com '=': ${pass.startsWith('=') ? 'Sim' : 'Não'}`);
  console.log();
  
  // Email de teste
  const testEmail = 'pracy1983@gmail.com'; // Substitua pelo seu email para teste
  
  try {
    // Teste 1: Envio de email de convite
    console.log('1. Testando envio de email de convite...');
    const inviteLink = 'https://nossotemplo.vercel.app/convite?token=123456';
    await sendInviteEmail(testEmail, inviteLink, 'Usuário Teste');
    
    // Teste 2: Envio de email de redefinição de senha
    console.log('\n2. Testando envio de email de redefinição de senha...');
    const resetLink = 'https://nossotemplo.vercel.app/redefinir-senha?token=123456';
    await sendPasswordResetEmail(testEmail, resetLink, 'Usuário Teste');
    
    console.log('\n✅ Todos os testes concluídos!');
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
  }
};

// Executar os testes de forma assíncrona e garantir que a saída seja exibida corretamente
runTests().then(() => {
  // Aguardar um pouco para garantir que todas as saídas sejam exibidas
  setTimeout(() => {
    console.log('\n=== FIM DOS TESTES ===');
  }, 1000);
});
