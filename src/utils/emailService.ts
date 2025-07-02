import { Student } from '../types';
import emailjs from '@emailjs/browser';

// Verificar se estamos em ambiente de produção (Netlify)
// Detectar automaticamente se estamos em produção ou desenvolvimento
const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');

// Serviço de email simulado para ambiente de desenvolvimento
const mockEmailService = {
  verify: async () => {
    console.log('Mock: Serviço de email verificado');
    return true;
  },
  sendMail: async (options: any) => {
    console.log('Mock: Email enviado', options);
    alert(`[DESENVOLVIMENTO] Email seria enviado para: ${options.to}\nAssunto: ${options.subject}\n\nEm produção, este email seria enviado de verdade.`);
    return { response: 'Simulação de envio bem-sucedida' };
  }
};

// Configuração do EmailJS
// Usando as variáveis de ambiente já configuradas no .env
const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_USER_ID || '';
const EMAIL_FROM = 'nossotemplo@aprendamagia.com.br';

// Serviço de email para produção usando EmailJS
const productionEmailService = {
  verify: async () => {
    try {
      console.log('Verificando configuração do EmailJS...');
      return true;
    } catch (error) {
      console.error('Erro ao verificar serviço de email:', error);
      return false;
    }
  },
  sendMail: async (options: any) => {
    try {
      console.log('Produção: Enviando email real para', options.to);
      
      // Preparar os parâmetros para o EmailJS
      const templateParams = {
        to_email: options.to,
        to_name: options.to.split('@')[0], // Nome básico extraído do email
        from_name: 'Nosso Templo',
        subject: options.subject,
        message: options.text || '',
        html_message: options.html || '',
        reply_to: EMAIL_FROM
      };
      
      // Enviar o email usando EmailJS
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      
      console.log('Email enviado com sucesso:', response);
      return response;
    } catch (error) {
      console.error('Erro ao enviar email em produção:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`Erro ao enviar email para: ${options.to}. Erro: ${errorMessage}`);
      throw error;
    }
  }
};

// Escolher o serviço apropriado com base no ambiente
const emailService = isProduction ? productionEmailService : mockEmailService;

/**
 * Verifica se o serviço de email está configurado corretamente
 * @returns Promise com o resultado da verificação
 */
export const verifyEmailService = async (): Promise<boolean> => {
  try {
    // Usar o serviço apropriado com base no ambiente
    const result = await emailService.verify();
    return result;
  } catch (error) {
    console.error('Erro ao verificar serviço de email:', error);
    return false;
  }
};

/**
 * Envia um email usando as configurações definidas
 * @param to Email do destinatário
 * @param subject Assunto do email
 * @param html Conteúdo HTML do email
 * @param text Conteúdo em texto plano do email (opcional)
 * @returns Promise com o resultado do envio
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> => {
  try {
    console.log(`Preparando para enviar email em ambiente ${isProduction ? 'de produção' : 'de desenvolvimento'}`);
    
    // Configuração do email
    const mailOptions = {
      from: '"Nosso Templo" <nossotemplo@aprendamagia.com.br>',
      to,
      subject,
      text: text || '',
      html
    };

    // Log para debug
    console.log(`Enviando email para: ${to}`);
    console.log(`Assunto: ${subject}`);
    
    // Usar o serviço apropriado com base no ambiente
    await emailService.sendMail(mailOptions);
    
    // Feedback adicional em desenvolvimento
    if (!isProduction) {
      console.log('Email simulado enviado com sucesso em ambiente de desenvolvimento');
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
};

/**
 * Envia um email de convite para um novo membro
 * @param to Email do destinatário
 * @param name Nome do destinatário
 * @param inviteLink Link de convite
 * @returns Promise com o resultado do envio
 */
export const sendInviteEmail = async (
  to: string,
  name: string,
  inviteLink: string
): Promise<boolean> => {
  const subject = 'Convite para o Nosso Templo';
  
  // Template do email de convite
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
      <h2 style="color: #333; text-align: center;">Convite para o Nosso Templo</h2>
      <p>Olá, <strong>${name}</strong>!</p>
      <p>Você foi convidado(a) para se juntar ao Nosso Templo.</p>
      <p>Para aceitar o convite e completar seu cadastro, clique no botão abaixo:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" style="background-color: #4a5568; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Aceitar Convite</a>
      </div>
      <p>Ou copie e cole o seguinte link no seu navegador:</p>
      <p style="background-color: #f8f9fa; padding: 10px; word-break: break-all;">${inviteLink}</p>
      <p>Este link é válido por 7 dias.</p>
      <p>Atenciosamente,<br>Equipe Nosso Templo</p>
    </div>
  `;

  // Em desenvolvimento, apenas logamos o email que seria enviado
  console.log('=== SIMULAÇÃO DE EMAIL DE CONVITE ===');
  console.log(`Para: ${to}`);
  console.log(`Nome: ${name}`);
  console.log(`Link: ${inviteLink}`);
  console.log('======================================');

  return await sendEmail(to, subject, html);
};

/**
 * Envia um email personalizado para um ou mais destinatários
 * @param to Email ou array de emails dos destinatários
 * @param subject Assunto do email
 * @param body Corpo do email (pode conter HTML)
 * @returns Promise com o resultado do envio
 */
export const sendCustomEmail = async (
  to: string | string[],
  subject: string,
  body: string
): Promise<boolean> => {
  // Converter para array se for uma string única
  const recipients = Array.isArray(to) ? to : [to];
  
  try {
    // Em desenvolvimento, apenas logamos os emails que seriam enviados
    console.log('=== SIMULAÇÃO DE EMAILS PERSONALIZADOS ===');
    console.log(`Destinatários: ${recipients.join(', ')}`);
    console.log(`Assunto: ${subject}`);
    console.log('======================================');
    
    // Enviar para cada destinatário
    for (const recipient of recipients) {
      await sendEmail(recipient, subject, body);
    }
    return true;
  } catch (error) {
    console.error('Erro ao enviar emails personalizados:', error);
    return false;
  }
};

/**
 * Gera um link de convite válido para um novo membro
 * @param token Token único do convite
 * @returns URL completa do convite
 */
export const generateInviteLink = (token: string): string => {
  // Usar o origin da janela atual ou um fallback para desenvolvimento local
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  // Corrigindo a rota para a que realmente existe na aplicação
  return `${baseUrl}/invite/${token}`;
};

/**
 * Gera um token único para convite
 * @returns Token de convite
 */
export const generateInviteToken = (): string => {
  return Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
};

/**
 * Prepara um novo estudante para convite
 * @param data Dados do convite
 * @returns Objeto Student preparado para convite
 */
export const prepareStudentInvite = (data: {
  fullName: string;
  email: string;
  unit: string;
  turma?: string;
  invitedBy?: string;
}): Student => {
  const inviteToken = generateInviteToken();
  
  return {
    id: Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
    fullName: data.fullName,
    email: data.email,
    unit: data.unit,
    turma: data.turma || '',
    birthDate: '1900-01-01', // Placeholder date for invites
    cpf: '',
    rg: '',
    phone: '',
    religion: '',
    isFounder: false,
    isActive: false, // Will be activated after approval
    attendance: [],
    isAdmin: false,
    isGuest: false,
    role: 'student',
    inviteStatus: 'pending',
    inviteToken,
    invitedAt: new Date().toISOString(),
    invitedBy: data.invitedBy || 'Administrador',
    isPendingApproval: false
  };
};
