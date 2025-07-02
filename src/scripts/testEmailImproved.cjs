/**
 * Script de teste melhorado para o serviço de email
 * Uso: node testEmailImproved.cjs [email] [nome]
 * Exemplo: node testEmailImproved.cjs usuario@exemplo.com "Nome do Usuário"
 */

require('dotenv').config();
const nodemailer = require('nodemailer');

// Função para obter variáveis de ambiente (suporta tanto prefixo VITE_ quanto sem prefixo)
const getEnvVar = (name) => {
  return process.env[name] || process.env[`VITE_${name}`] || '';
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
  console.log('\n=== SIMULAÇÃO DE EMAIL ===');
  console.log(`Para: ${to}`);
  console.log(`Assunto: ${subject}`);
  console.log('Conteúdo:', content);
  console.log('=== FIM DA SIMULAÇÃO ===\n');
};

// Função para enviar email
const sendEmail = async (to, subject, html) => {
  try {
    console.log(`Tentando enviar email para ${to}...`);
    
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
    console.warn(`❌ Erro ao enviar email real: ${error?.message || 'Erro desconhecido'}`);
    console.log('Usando simulação de email como fallback...');
    
    simulateEmailSend(to, subject, html);
    return false;
  }
};

// Função para enviar email de convite
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
  
  console.log(`Testando envio de email para ${email}...`);
  
  // Criar um link de convite de teste
  const inviteToken = 'teste-' + Date.now();
  const inviteUrl = `https://nossotemplo.netlify.app/convite/${inviteToken}`;
  
  // Enviar email de convite
  const result = await sendInviteEmail(email, inviteUrl, name);
  
  if (result) {
    console.log(`\n✅ Email de convite enviado com sucesso para ${email}!`);
  } else {
    console.log(`\n⚠️ Email de convite enviado usando simulação para ${email}.`);
  }
};

// Executar o programa
main();
