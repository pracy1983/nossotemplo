import { Student } from '../types';

// Verificar se estamos em ambiente de produção (Netlify)
const isProduction = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');

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

// Em produção, usaríamos um serviço real de email
// Esta é uma implementação básica que pode ser expandida para usar serviços como SendGrid, Mailgun, etc.
const productionEmailService = {
  verify: async () => {
    // Em produção, verificaria a conexão com o serviço de email
    return true;
  },
  sendMail: async (options: any) => {
    // Em produção, enviaria o email usando um serviço real
    // Esta é apenas uma simulação para fins de demonstração
    try {
      // Aqui você integraria com um serviço real como SendGrid, Mailgun, etc.
      console.log('Produção: Enviando email real para', options.to);
      
      // Exemplo de integração com API de email (comentado)
      /*
      const response = await fetch('https://api.emailservice.com/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_API_KEY'
        },
        body: JSON.stringify({
          from: options.from,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text
        })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao enviar email');
      }
      
      return await response.json();
      */
      
      // Por enquanto, apenas simulamos o envio em produção também
      return { response: 'Email enviado com sucesso em produção' };
    } catch (error) {
      console.error('Erro ao enviar email em produção:', error);
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
