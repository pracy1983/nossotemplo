import nodemailer from 'nodemailer';
import 'dotenv/config';

// Configuração do transporter do Nodemailer usando Mailtrap para testes
// Isso pode ser substituído por um serviço de email real em produção
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  secure: false,
  auth: {
    user: "5a0a5a5a5a5a5a", // Substitua por suas credenciais do Mailtrap
    pass: "5a0a5a5a5a5a5a"  // Substitua por suas credenciais do Mailtrap
  }
});

// Função para enviar email
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    const info = await transporter.sendMail({
      from: '"Nosso Templo" <nossotemplo@example.com>',
      to,
      subject,
      html
    });

    console.log('Email enviado com sucesso:', info.messageId);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
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
      <p>Você foi convidado para participar do Nosso Templo. Para aceitar o convite e criar sua conta, clique no link abaixo:</p>
      <p><a href="${inviteLink}" style="display: inline-block; background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Aceitar Convite</a></p>
      <p>Este convite expira em 7 dias.</p>
      <p>Atenciosamente,<br>Equipe Nosso Templo</p>
    </div>
  `;

  return sendEmail(to, subject, html);
};

// Função para simular o envio de email (para desenvolvimento)
export const simulateEmailSend = (to: string, subject: string, content: string): void => {
  console.log('=== SIMULAÇÃO DE EMAIL ===');
  console.log(`Para: ${to}`);
  console.log(`Assunto: ${subject}`);
  console.log('Conteúdo:', content);
  console.log('=== FIM DA SIMULAÇÃO ===');
};
