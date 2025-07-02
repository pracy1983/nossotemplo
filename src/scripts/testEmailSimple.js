// Script simples para testar o envio de email
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('=== TESTE DO SERVIÇO DE EMAIL ===');
  console.log('Configurando o transporter...');

  try {
    // Criar o transporter com as configurações do .env
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true, // true para porta 465
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    console.log('Configurações do email:');
    console.log(`Host: ${process.env.EMAIL_HOST}`);
    console.log(`Port: ${process.env.EMAIL_PORT}`);
    console.log(`User: ${process.env.EMAIL_USER}`);
    console.log(`From: ${process.env.EMAIL_FROM}`);

    // Verificar conexão
    console.log('Verificando conexão com o servidor SMTP...');
    await transporter.verify();
    console.log('✓ Conexão com servidor SMTP estabelecida com sucesso!');

    // Enviar email de teste
    console.log('Enviando email de teste...');
    const info = await transporter.sendMail({
      from: `"Nosso Templo" <${process.env.EMAIL_FROM}>`,
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

    console.log('✓ Email enviado com sucesso!');
    console.log('ID da mensagem:', info.messageId);
    console.log('\n✅ Teste concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
  }
}

// Executar o teste
testEmail();
