// Script final para testar o serviço de email com fallback para simulação
require('dotenv').config();
const nodemailer = require('nodemailer');

// Função para obter variáveis de ambiente (suporta tanto prefixo VITE_ quanto sem prefixo)
const getEnvVar = (name) => {
  return process.env[name] || process.env[`VITE_${name}`] || '';
};

// Função para simular o envio de email
const simulateEmailSend = (to, subject, content) => {
  console.log('\n=== SIMULAÇÃO DE EMAIL ===');
  console.log(`Para: ${to}`);
  console.log(`Assunto: ${subject}`);
  console.log('Conteúdo:', content);
  console.log('=== FIM DA SIMULAÇÃO ===\n');
  return true;
};

// Função para enviar email com fallback para simulação
const sendEmailWithFallback = async (to, subject, html) => {
  console.log(`Tentando enviar email para ${to}...`);
  
  try {
    // Criar o transporter com a mesma lógica do serviço de email
    const transporter = nodemailer.createTransport({
      host: getEnvVar('EMAIL_HOST') || getEnvVar('SMTP_HOST') || 'mail.aprendamagia.com.br',
      port: Number(getEnvVar('EMAIL_PORT') || getEnvVar('SMTP_PORT') || 465),
      secure: true, // true para porta 465
      auth: {
        user: getEnvVar('EMAIL_USER') || getEnvVar('SMTP_USER') || 'nossotemplo@aprendamagia.com.br',
        pass: getEnvVar('EMAIL_PASS') || getEnvVar('SMTP_PASSWORD') || ''
      },
      tls: {
        rejectUnauthorized: false // Ignorar erros de certificado
      }
    });
    
    // Tentar enviar email real
    const info = await transporter.sendMail({
      from: getEnvVar('EMAIL_FROM') || '"Nosso Templo" <nossotemplo@aprendamagia.com.br>',
      to,
      subject,
      html
    });
    
    console.log('✅ Email enviado com sucesso!');
    console.log('ID da mensagem:', info.messageId);
    return true;
    
  } catch (error) {
    console.warn(`❌ Erro ao enviar email real: ${error.message}`);
    console.log('Usando simulação de email como fallback...');
    
    // Usar simulação como fallback
    return simulateEmailSend(to, subject, html);
  }
};

// Função para enviar email de convite
const sendInviteEmail = async (to, inviteLink, name) => {
  const subject = 'Convite - Nosso Templo';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Convite para o Nosso Templo</h2>
      <p>Olá ${name},</p>
      <p>Você foi convidado para participar do Nosso Templo. Para aceitar o convite e criar sua conta, clique no link abaixo:</p>
      <p><a href="${inviteLink}" style="display: inline-block; background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Aceitar Convite</a></p>
      <p>Este convite expira em 7 dias.</p>
      <p>Atenciosamente,<br>Equipe Nosso Templo</p>
    </div>
  `;

  return sendEmailWithFallback(to, subject, html);
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

  return sendEmailWithFallback(to, subject, html);
};

// Testar o serviço de email
async function testEmailService() {
  console.log('=== TESTE DO SERVIÇO DE EMAIL FINAL ===');
  
  // Mostrar as configurações que serão usadas
  console.log('Configurações:');
  console.log(`Host: ${getEnvVar('EMAIL_HOST') || getEnvVar('SMTP_HOST')}`);
  console.log(`Port: ${getEnvVar('EMAIL_PORT') || getEnvVar('SMTP_PORT')}`);
  console.log(`User: ${getEnvVar('EMAIL_USER') || getEnvVar('SMTP_USER')}`);
  console.log(`From: ${getEnvVar('EMAIL_FROM')}`);
  
  // Verificar se a senha está definida (sem mostrar o valor)
  const password = getEnvVar('EMAIL_PASS') || getEnvVar('SMTP_PASSWORD');
  console.log(`Senha definida: ${password ? 'Sim' : 'Não'}`);
  console.log(`Senha começa com '=': ${password.startsWith('=') ? 'Sim' : 'Não'}`);
  
  // Testar envio de email de convite
  console.log('\n1. Testando envio de email de convite...');
  await sendInviteEmail(
    'pracy1983@gmail.com',
    'https://nossotemplo.vercel.app/convite/abc123xyz456',
    'Usuário Teste'
  );
  
  // Testar envio de email de redefinição de senha
  console.log('\n2. Testando envio de email de redefinição de senha...');
  await sendPasswordResetEmail(
    'pracy1983@gmail.com',
    'https://nossotemplo.vercel.app/redefinir-senha/789def012ghi',
    'Usuário Teste'
  );
  
  console.log('\n✅ Todos os testes concluídos!');
}

// Executar o teste
testEmailService().catch(error => {
  console.error('Erro durante os testes:', error);
});
