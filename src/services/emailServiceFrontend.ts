/**
 * Serviço de email para o frontend
 * Esta versão é compatível com o navegador e não usa o Nodemailer diretamente
 */

import { supabaseManager } from '../lib/supabaseClient';

// Função para simular o envio de email (para desenvolvimento)
export const simulateEmailSend = (to: string, subject: string, content: string): void => {
  console.log('\n=== SIMULAÇÃO DE EMAIL ===');
  console.log(`Para: ${to}`);
  console.log(`Assunto: ${subject}`);
  console.log('Conteúdo:', content);
  console.log('=== FIM DA SIMULAÇÃO ===\n');
};

// Interface para os dados do email
interface EmailData {
  to: string;
  subject: string;
  html: string;
  name?: string;
  link?: string;
}

/**
 * Função para enviar email usando Supabase Edge Functions ou simulação
 * Esta função tenta enviar o email via API e, em caso de falha, usa simulação
 */
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    console.log(`Tentando enviar email para ${to}...`);
    
    // Em ambiente de desenvolvimento, usamos simulação
    if (import.meta.env.DEV) {
      simulateEmailSend(to, subject, html);
      return true;
    }
    
    // Em ambiente de produção, tentamos enviar o email real com retry
    let attempts = 0;
    const maxAttempts = 2;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Tentativa ${attempts} de enviar email para ${to}...`);
        
        const endpoint = attempts === 1 
          ? '/.netlify/functions/send-email' 
          : '/api/send-email';
          
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to,
            subject,
            html,
            from: 'Nosso Templo <nossotemplo@aprendamagia.com.br>'
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.log(`Erro na tentativa ${attempts}:`, errorData);
          throw new Error(errorData.message || 'Erro ao enviar email');
        }
        
        console.log('Email enviado com sucesso!');
        return true;
      } catch (retryError) {
        console.log(`Falha na tentativa ${attempts}:`, retryError);
        if (attempts >= maxAttempts) {
          throw retryError;
        }
      }
    }
    
    return false; // Nunca deve chegar aqui, mas TypeScript exige um retorno
  } catch (error: any) {
    console.warn(`❌ Erro ao enviar email: ${error?.message || 'Erro desconhecido'}`);
    console.log('Usando simulação de email como fallback...');
    
    // Usar simulação como fallback
    simulateEmailSend(to, subject, html);
    return true; // Retorna true mesmo com simulação para não interromper o fluxo da aplicação
  }
};

/**
 * Função específica para enviar email de redefinição de senha
 */
export const sendPasswordResetEmail = async (to: string, resetLink: string, name: string): Promise<boolean> => {
  console.log('Reset Link recebido em emailServiceFrontend:', resetLink);
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

/**
 * Função para enviar convite para novos membros
 */
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
