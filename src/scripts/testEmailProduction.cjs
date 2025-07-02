/**
 * Script de teste para o serviço de email em ambiente de produção
 * Este script testa o serviço de email com configurações reais de produção
 * Ele verifica se as variáveis de ambiente estão configuradas corretamente
 * e tenta enviar emails de teste para verificar a conectividade SMTP
 */

require('dotenv').config();

// Função para obter variáveis de ambiente (suporta tanto prefixo VITE_ quanto sem prefixo)
const getEnvVar = (name) => {
  return process.env[name] || process.env[`VITE_${name}`] || '';
};

// Função para simular o envio de email (fallback)
const simulateEmailSend = (to, subject, content) => {
  console.log('\n=== SIMULAÇÃO DE EMAIL ===');
  console.log(`Para: ${to}`);
  console.log(`Assunto: ${subject}`);
  console.log('Conteúdo:', content);
  console.log('=== FIM DA SIMULAÇÃO ===\n');
  return true;
};

// Configuração do transporter do Nodemailer
const nodemailer = require('nodemailer');

// Função para criar o transporter com as configurações atuais
const createTransporter = () => {
  const host = getEnvVar('EMAIL_HOST') || getEnvVar('SMTP_HOST') || 'mail.aprendamagia.com.br';
  const port = Number(getEnvVar('EMAIL_PORT') || getEnvVar('SMTP_PORT') || 465);
  const user = getEnvVar('EMAIL_USER') || getEnvVar('SMTP_USER') || 'nossotemplo@aprendamagia.com.br';
  const pass = getEnvVar('EMAIL_PASS') || getEnvVar('SMTP_PASSWORD') || '';
  
  return nodemailer.createTransport({
    host,
    port,
    secure: true, // true para porta 465, false para outras portas
    auth: {
      user,
      pass
    },
    tls: {
      // Não verificar certificado para evitar problemas com certificados autoassinados
      rejectUnauthorized: false
    }
  });
};

// Função para enviar email com fallback para simulação
const sendEmail = async (to, subject, html) => {
  try {
    console.log(`Tentando enviar email para ${to}...`);
    
    const transporter = createTransporter();
    const from = getEnvVar('EMAIL_FROM') || '"Nosso Templo" <nossotemplo@aprendamagia.com.br>';
    
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });

    console.log('✅ Email enviado com sucesso:', info.messageId);
    return true;
  } catch (error) {
    console.warn(`❌ Erro ao enviar email real: ${error?.message || 'Erro desconhecido'}`);
    console.log('Usando simulação de email como fallback...');
    
    // Usar simulação como fallback
    simulateEmailSend(to, subject, html);
    return true; // Retorna true mesmo com simulação para não interromper o fluxo da aplicação
  }
};

// Função para verificar a configuração SMTP
const testSmtpConnection = async () => {
  try {
    console.log('Testando conexão SMTP...');
    
    const transporter = createTransporter();
    const result = await transporter.verify();
    
    console.log('✅ Conexão SMTP verificada com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão SMTP:', error?.message || 'Erro desconhecido');
    return false;
  }
};

// Função principal para executar os testes
const runTests = async () => {
  console.log('=== TESTE DO SERVIÇO DE EMAIL EM PRODUÇÃO ===');
  
  // Mostrar configurações
  const host = getEnvVar('EMAIL_HOST') || getEnvVar('SMTP_HOST') || 'mail.aprendamagia.com.br';
  const port = getEnvVar('EMAIL_PORT') || getEnvVar('SMTP_PORT') || 465;
  const user = getEnvVar('EMAIL_USER') || getEnvVar('SMTP_USER') || 'nossotemplo@aprendamagia.com.br';
  const from = getEnvVar('EMAIL_FROM') || '"Nosso Templo" <nossotemplo@aprendamagia.com.br>';
  const pass = getEnvVar('EMAIL_PASS') || getEnvVar('SMTP_PASSWORD') || '';
  
  console.log('Configurações:');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`From: ${from}`);
  console.log(`Senha definida: ${pass ? 'Sim' : 'Não'}`);
  console.log(`Senha começa com '=': ${pass.startsWith('=') ? 'Sim' : 'Não'}`);
  console.log();
  
  // Testar conexão SMTP
  const smtpOk = await testSmtpConnection();
  
  if (!smtpOk) {
    console.log('\n⚠️ A conexão SMTP falhou, mas o teste continuará usando simulação como fallback.');
  }
  
  // Email de teste
  const testEmail = process.argv[2] || 'nossotemplosp@gmail.com'; // Use o email passado como argumento ou um padrão; // Substitua pelo seu email para teste
  
  try {
    // Teste 1: Envio de email simples
    console.log('\n1. Testando envio de email simples...');
    await sendEmail(
      testEmail, 
      'Teste de Email - Nosso Templo', 
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Teste de Email</h2>
          <p>Este é um email de teste do sistema Nosso Templo.</p>
          <p>Data e hora do teste: ${new Date().toLocaleString()}</p>
          <p>Se você está vendo este email, o sistema de envio está funcionando corretamente!</p>
        </div>
      `
    );
    
    // Teste 2: Envio de email com anexo simulado (apenas HTML)
    console.log('\n2. Testando envio de email com anexo simulado...');
    await sendEmail(
      testEmail, 
      'Teste de Email com Anexo - Nosso Templo', 
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Teste de Email com Anexo</h2>
          <p>Este é um email de teste com anexo simulado.</p>
          <p>Em uma implementação real, aqui teria um anexo.</p>
          <div style="border: 1px dashed #ccc; padding: 10px; margin: 15px 0;">
            <p style="margin: 0;"><strong>📎 arquivo_exemplo.pdf</strong> (simulado)</p>
          </div>
        </div>
      `
    );
    
    console.log('\n✅ Todos os testes concluídos!');
    
    if (!smtpOk) {
      console.log('\n⚠️ Lembrete: A conexão SMTP falhou, mas os emails foram simulados com sucesso.');
      console.log('Verifique as configurações de email no arquivo .env:');
      console.log('1. Certifique-se de que as credenciais estão corretas');
      console.log('2. Verifique se o servidor SMTP está acessível');
      console.log('3. Confirme se não há bloqueios de firewall ou rede');
    }
  } catch (error) {
    console.error('\n❌ Erro durante os testes:', error);
  }
};

// Executar os testes de forma assíncrona e garantir que a saída seja exibida corretamente
runTests().then(() => {
  // Aguardar um pouco para garantir que todas as saídas sejam exibidas
  setTimeout(() => {
    console.log('\n=== FIM DOS TESTES ===');
  }, 1000);
});
