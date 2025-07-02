// Script de teste atualizado para o serviço de email
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailService() {
  console.log('=== TESTE DO SERVIÇO DE EMAIL ATUALIZADO ===');
  
  // Função para obter variáveis de ambiente (suporta tanto prefixo VITE_ quanto sem prefixo)
  const getEnvVar = (name) => {
    return process.env[name] || process.env[`VITE_${name}`] || '';
  };
  
  // Mostrar as configurações que serão usadas
  console.log('Configurações:');
  console.log(`Host: ${getEnvVar('EMAIL_HOST') || getEnvVar('SMTP_HOST')}`);
  console.log(`Port: ${getEnvVar('EMAIL_PORT') || getEnvVar('SMTP_PORT')}`);
  console.log(`User: ${getEnvVar('EMAIL_USER') || getEnvVar('SMTP_USER')}`);
  console.log(`From: ${getEnvVar('EMAIL_FROM')}`);
  
  // Verificar se a senha está definida (sem mostrar o valor)
  const password = getEnvVar('EMAIL_PASS') || getEnvVar('SMTP_PASSWORD');
  console.log(`Senha definida: ${password ? 'Sim' : 'Não'}`);
  console.log(`Senha começa com '=': ${password.startsWith('=') ? 'Sim' : 'Não'}`);
  
  try {
    // Criar o transporter com a mesma lógica do serviço de email
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
      },
      debug: true // Ativar logs de debug
    });
    
    // Verificar conexão
    console.log('\nVerificando conexão com o servidor SMTP...');
    await transporter.verify();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Enviar email de teste
    console.log('\nEnviando email de teste...');
    const info = await transporter.sendMail({
      from: getEnvVar('EMAIL_FROM') || '"Nosso Templo" <nossotemplo@aprendamagia.com.br>',
      to: 'pracy1983@gmail.com',
      subject: 'Teste Atualizado - Nosso Templo',
      text: 'Este é um email de teste do sistema Nosso Templo com configurações atualizadas.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #6b0f1a; text-align: center;">Nosso Templo</h2>
          <p>Este é um email de teste do sistema Nosso Templo com configurações atualizadas.</p>
          <p>Se você está recebendo este email, significa que a configuração do serviço de email está funcionando corretamente.</p>
          <div style="text-align: center; margin-top: 20px; padding: 10px; background-color: #f5f5f5;">
            <p style="font-size: 12px; color: #666;">© ${new Date().getFullYear()} Nosso Templo. Todos os direitos reservados.</p>
          </div>
        </div>
      `
    });
    
    console.log('✅ Email enviado com sucesso!');
    console.log('ID da mensagem:', info.messageId);
    console.log('\n✅ Teste concluído com sucesso!');
    
  } catch (error) {
    console.error('\n❌ Erro durante o teste:', error);
    
    // Mostrar detalhes adicionais do erro
    if (error.code === 'EAUTH') {
      console.error('\nErro de autenticação. Verifique se o usuário e senha estão corretos.');
      console.error('Resposta do servidor:', error.response);
    } else if (error.code === 'ESOCKET') {
      console.error('\nErro de conexão SSL/TLS. Verifique as configurações de porta e SSL.');
    }
  }
}

// Executar o teste
testEmailService();
