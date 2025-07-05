// Script de teste para envio de email (CommonJS)
const nodemailer = require('nodemailer');

// Configuração SMTP direta com as credenciais fornecidas
const smtpConfig = {
  host: 'mail.aprendamagia.com.br',
  port: 465,
  secure: true,
  auth: {
    user: 'nossotemplo@aprendamagia.com.br',
    pass: 'R5koP*sRbQtP'
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true,
  logger: true
};

console.log('Iniciando teste de email...');
console.log('Configuração SMTP:', {
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  user: smtpConfig.auth.user,
  tls: smtpConfig.tls
});

// Criar transporter
const transporter = nodemailer.createTransport(smtpConfig);

// Verificar conexão
console.log('Verificando conexão SMTP...');
transporter.verify(function(error, success) {
  if (error) {
    console.error('Erro na verificação SMTP:', error);
    process.exit(1);
  } else {
    console.log('Servidor SMTP pronto para enviar mensagens');
    
    // Enviar email de teste
    console.log('Enviando email de teste...');
    transporter.sendMail({
      from: '"Nosso Templo" <nossotemplo@aprendamagia.com.br>',
      to: 'nossotemplosp@gmail.com',
      subject: 'Teste de Email - ' + new Date().toISOString(),
      html: '<p>Este é um email de teste enviado em ' + new Date().toLocaleString() + '</p>'
    }, (err, info) => {
      if (err) {
        console.error('Erro ao enviar email:', err);
        process.exit(1);
      } else {
        console.log('Email enviado com sucesso:', info.messageId);
        process.exit(0);
      }
    });
  }
});
