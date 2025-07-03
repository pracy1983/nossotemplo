// API para envio de emails
const nodemailer = require('nodemailer');
require('dotenv').config();

// Função para obter variáveis de ambiente (suporta tanto prefixo VITE_ quanto sem prefixo)
const getEnvVar = (name) => {
  return process.env[name] || process.env[`VITE_${name}`] || '';
};

// Configuração do transporter
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

// Handler para a requisição POST
exports.handler = async (event, context) => {
  try {
    // Verificar método
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Método não permitido' })
      };
    }

    // Obter dados do corpo da requisição
    const { to, subject, html, from } = JSON.parse(event.body);

    // Validar dados
    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Dados incompletos' })
      };
    }

    // Enviar email
    const info = await transporter.sendMail({
      from: from || getEnvVar('EMAIL_FROM') || '"Nosso Templo" <nossotemplo@aprendamagia.com.br>',
      to,
      subject,
      html
    });

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
        error: error.message
      })
    };
  }
};
