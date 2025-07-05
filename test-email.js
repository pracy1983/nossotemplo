// Script de teste para envio de email
import nodemailer from 'nodemailer';

// Configuração SMTP direta
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

// Criar transporter
const transporter = nodemailer.createTransport(smtpConfig);

// Verificar conexão
console.log('Verificando conexão SMTP...');
transporter.verify(function(error, success) {
  if (error) {
    console.error('Erro na verificação SMTP:', error);
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
      } else {
        console.log('Email enviado com sucesso:', info.messageId);
      }
    });
  }
});
