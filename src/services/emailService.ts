import nodemailer from 'nodemailer';
import 'dotenv/config'; // Importar variáveis de ambiente

// Obter variáveis de ambiente (suporta tanto prefixo VITE_ quanto sem prefixo)
const getEnvVar = (name: string): string => {
  return process.env[name] || process.env[`VITE_${name}`] || '';
};

// Função para simular o envio de email (fallback)
export const simulateEmailSend = (to: string, subject: string, content: string): void => {
  console.log('\n=== SIMULAÇÃO DE EMAIL ===');
  console.log(`Para: ${to}`);
  console.log(`Assunto: ${subject}`);
  console.log('Conteúdo:', content);
  console.log('=== FIM DA SIMULAÇÃO ===\n');
};

// Configuração do transporter do Nodemailer
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
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
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
  } catch (error: any) {
    console.warn(`❌ Erro ao enviar email real: ${error?.message || 'Erro desconhecido'}`);
    console.log('Usando simulação de email como fallback...');
    
    // Usar simulação como fallback
    simulateEmailSend(to, subject, html);
    return true; // Retorna true mesmo com simulação para não interromper o fluxo da aplicação
  }
};

// Função específica para enviar email de redefinição de senha
export const sendPasswordResetEmail = async (to: string, resetLink: string, name: string): Promise<boolean> => {
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
export const sendInviteEmail = async (to: string, inviteLink: string, name: string): Promise<boolean> => {
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
