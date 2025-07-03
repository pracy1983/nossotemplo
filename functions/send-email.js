// API para envio de emails
const nodemailer = require('nodemailer');

// Função para obter variáveis de ambiente (suporta tanto prefixo VITE_ quanto sem prefixo)
const getEnvVar = (name) => {
  return process.env[name] || process.env[`VITE_${name}`] || '';
};

// Configuração do SMTP
const smtpConfig = {
  host: 'mail.aprendamagia.com.br',
  port: 465,
  secure: true, // true para porta 465
  auth: {
    user: 'nossotemplo@aprendamagia.com.br',
    pass: process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || 'R5koP*sRbQtP'
  },
  tls: {
    rejectUnauthorized: false // Ignorar erros de certificado
  }
};

// Criação do transporter
const transporter = nodemailer.createTransport(smtpConfig);

// Handler para a requisição POST
exports.handler = async (event, context) => {
  try {
    // Log das variáveis de ambiente (sem expor senhas)
    console.log('Ambiente:', {
      NODE_ENV: process.env.NODE_ENV,
      SMTP_HOST_EXISTS: !!process.env.SMTP_HOST,
      EMAIL_HOST_EXISTS: !!process.env.EMAIL_HOST,
      SMTP_USER_EXISTS: !!process.env.SMTP_USER,
      EMAIL_USER_EXISTS: !!process.env.EMAIL_USER
    });

    // Verificar método
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Método não permitido' })
      };
    }

    // Obter dados do corpo da requisição
    const { to, subject, html, from } = JSON.parse(event.body);
    console.log(`Tentando enviar email para: ${to}`);

    // Validar dados
    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Dados incompletos' })
      };
    }

    // Verificar configuração do transporter
    console.log('Configuração SMTP:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      user: smtpConfig.auth.user,
      tls: smtpConfig.tls
    });

    // Enviar email
    const info = await transporter.sendMail({
      from: from || '"Nosso Templo" <nossotemplo@aprendamagia.com.br>',
      to,
      subject,
      html
    });

    console.log('Email enviado com sucesso:', info.messageId);
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Email enviado com sucesso',
        messageId: info.messageId
      })
    };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Erro ao enviar email',
        error: error.message,
        stack: error.stack
      })
    };
  }
};
