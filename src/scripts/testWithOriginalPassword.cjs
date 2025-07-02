// Script para testar com a senha original
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testWithOriginalPassword() {
  console.log('=== TESTE COM SENHA ORIGINAL ===');
  
  try {
    // Usar a senha original que estava hardcoded
    const originalPassword = '=Xh%fWTEa~&H';
    
    // Criar o transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'mail.aprendamagia.com.br',
      port: process.env.EMAIL_PORT || 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER || 'nossotemplo@aprendamagia.com.br',
        pass: originalPassword // Usar a senha original
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    
    console.log('Verificando conexão...');
    await transporter.verify();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Tentar enviar um email de teste
    console.log('Enviando email de teste...');
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Nosso Templo" <nossotemplo@aprendamagia.com.br>',
      to: 'pracy1983@gmail.com',
      subject: 'Teste de Email - Nosso Templo',
      text: 'Este é um email de teste do sistema Nosso Templo.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #6b0f1a; text-align: center;">Nosso Templo</h2>
          <p>Este é um email de teste do sistema Nosso Templo.</p>
          <p>Se você está recebendo este email, significa que a configuração do serviço de email está funcionando corretamente.</p>
          <div style="text-align: center; margin-top: 20px; padding: 10px; background-color: #f5f5f5;">
            <p style="font-size: 12px; color: #666;">© ${new Date().getFullYear()} Nosso Templo. Todos os direitos reservados.</p>
          </div>
        </div>
      `
    });
    
    console.log('✅ Email enviado com sucesso!');
    console.log('ID da mensagem:', info.messageId);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    
    if (error.code === 'EAUTH') {
      console.error('Erro de autenticação. A senha original também não funciona.');
    }
  }
}

testWithOriginalPassword();
