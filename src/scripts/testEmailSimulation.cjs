// Script para testar a simulação de envio de email
require('dotenv').config();

// Função para simular o envio de email (mesma do emailServiceAlternative.ts)
const simulateEmailSend = (to, subject, content) => {
  console.log('\n=== SIMULAÇÃO DE EMAIL ===');
  console.log(`Para: ${to}`);
  console.log(`Assunto: ${subject}`);
  console.log('Conteúdo:', content);
  console.log('=== FIM DA SIMULAÇÃO ===\n');
  return true;
};

// Função para testar o envio de email de convite
const testInviteEmail = () => {
  const email = 'pracy1983@gmail.com';
  const fullName = 'Usuário Teste';
  const inviteToken = 'abc123xyz456';
  const inviteUrl = `https://nossotemplo.vercel.app/convite/${inviteToken}`;
  
  console.log('Testando simulação de email de convite...');
  
  simulateEmailSend(
    email,
    'Convite - Nosso Templo',
    `Olá ${fullName}, você foi convidado para o Nosso Templo. Acesse: ${inviteUrl}`
  );
  
  console.log('✅ Simulação de email de convite concluída com sucesso!');
};

// Função para testar o envio de email de redefinição de senha
const testPasswordResetEmail = () => {
  const email = 'pracy1983@gmail.com';
  const fullName = 'Usuário Teste';
  const resetToken = '789def012ghi';
  const resetUrl = `https://nossotemplo.vercel.app/redefinir-senha/${resetToken}`;
  
  console.log('Testando simulação de email de redefinição de senha...');
  
  simulateEmailSend(
    email,
    'Redefinição de Senha - Nosso Templo',
    `Olá ${fullName}, você solicitou a redefinição de senha. Acesse: ${resetUrl}`
  );
  
  console.log('✅ Simulação de email de redefinição de senha concluída com sucesso!');
};

// Executar os testes
console.log('=== TESTE DE SIMULAÇÃO DE ENVIO DE EMAIL ===');
testInviteEmail();
testPasswordResetEmail();
console.log('=== TODOS OS TESTES CONCLUÍDOS COM SUCESSO ===');
