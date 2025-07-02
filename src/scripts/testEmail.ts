import { sendEmail, sendPasswordResetEmail, sendInviteEmail } from '../services/emailServiceFrontend';

// Função para testar o envio de email
async function testEmail() {
  try {
    console.log('Iniciando teste de envio de email...');
    
    // Teste de email simples
    console.log('1. Enviando email simples...');
    await sendEmail(
      'pracy1983@gmail.com', // Email real para teste
      'Teste de Email - Nosso Templo',
      'Este é um email de teste do sistema Nosso Templo.'
    );
    console.log('✓ Email simples enviado com sucesso!');

    // Teste de email de redefinição de senha
    console.log('2. Enviando email de redefinição de senha...');
    await sendPasswordResetEmail(
      'pracy1983@gmail.com',
      'https://nossotemplo.vercel.app/reset-password?token=123456',
      'Usuário Teste'
    );
    console.log('✓ Email de redefinição de senha enviado com sucesso!');

    // Teste de email de convite
    console.log('3. Enviando email de convite...');
    await sendInviteEmail(
      'pracy1983@gmail.com',
      'https://nossotemplo.vercel.app/convite/123456',
      'Usuário Convidado'
    );
    console.log('✓ Email de convite enviado com sucesso!');

    console.log('\n✅ Todos os emails foram enviados com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro ao enviar emails:', error);
  }
}

// Executar o teste
console.log('=== TESTE DO SERVIÇO DE EMAIL ===');
testEmail();
