// Script para testar a conexão SMTP
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSmtpConnection() {
  console.log('=== TESTE DE CONEXÃO SMTP ===');
  
  // Mostrar as configurações (sem a senha)
  console.log('Configurações:');
  console.log(`Host: ${process.env.EMAIL_HOST}`);
  console.log(`Port: ${process.env.EMAIL_PORT}`);
  console.log(`User: ${process.env.EMAIL_USER}`);
  console.log(`From: ${process.env.EMAIL_FROM}`);
  
  try {
    // Criar o transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true, // true para porta 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false // Ignorar erros de certificado
      },
      debug: true // Ativar logs de debug
    });
    
    // Verificar conexão
    console.log('\nVerificando conexão com o servidor SMTP...');
    await transporter.verify();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    return true;
  } catch (error) {
    console.error('\n❌ Erro de conexão:', error);
    
    // Mostrar detalhes adicionais do erro
    if (error.code === 'EAUTH') {
      console.error('\nErro de autenticação. Verifique se o usuário e senha estão corretos.');
      console.error('Resposta do servidor:', error.response);
    } else if (error.code === 'ESOCKET') {
      console.error('\nErro de conexão SSL/TLS. Verifique as configurações de porta e SSL.');
    }
    
    return false;
  }
}

// Executar o teste
testSmtpConnection();
