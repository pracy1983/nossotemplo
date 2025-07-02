/**
 * Script de diagnóstico para o serviço de email
 * Este script permite testar o envio de email para um endereço específico
 * e fornece logs detalhados sobre todo o processo
 */

require('dotenv').config();
const readline = require('readline');

// Função para obter variáveis de ambiente (suporta tanto prefixo VITE_ quanto sem prefixo)
const getEnvVar = (name) => {
  return process.env[name] || process.env[`VITE_${name}`] || '';
};

// Configuração do transporter do Nodemailer com logs detalhados
const nodemailer = require('nodemailer');

// Função para criar o transporter com as configurações atuais
const createTransporter = () => {
  const host = getEnvVar('EMAIL_HOST') || getEnvVar('SMTP_HOST') || 'mail.aprendamagia.com.br';
  const port = Number(getEnvVar('EMAIL_PORT') || getEnvVar('SMTP_PORT') || 465);
  const user = getEnvVar('EMAIL_USER') || getEnvVar('SMTP_USER') || 'nossotemplo@aprendamagia.com.br';
  const pass = getEnvVar('EMAIL_PASS') || getEnvVar('SMTP_PASSWORD') || '';
  
  console.log('\n=== CONFIGURAÇÃO SMTP ===');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`User: ${user}`);
  console.log(`From: ${getEnvVar('EMAIL_FROM') || '"Nosso Templo" <nossotemplo@aprendamagia.com.br>'}`);
  console.log(`Senha definida: ${pass ? 'Sim' : 'Não'}`);
  console.log('=========================\n');
  
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
    },
    debug: true, // Ativar logs detalhados
    logger: true  // Mostrar logs no console
  });
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

// Função para enviar email com fallback para simulação e logs detalhados
const sendEmail = async (to, subject, html) => {
  console.log(`\n🔍 DIAGNÓSTICO: Tentando enviar email para ${to}...`);
  console.log(`🔍 Verificando formato do email: ${to}`);
  
  // Validação básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    console.error(`❌ ERRO: O formato do email "${to}" parece inválido!`);
    return false;
  }
  
  try {
    console.log(`📤 Iniciando envio de email para ${to}...`);
    
    const transporter = createTransporter();
    const from = getEnvVar('EMAIL_FROM') || '"Nosso Templo" <nossotemplo@aprendamagia.com.br>';
    
    console.log(`📧 De: ${from}`);
    console.log(`📧 Para: ${to}`);
    console.log(`📧 Assunto: ${subject}`);
    
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html
    });

    console.log('\n✅ Email enviado com sucesso!');
    console.log('📝 Detalhes da resposta:');
    console.log(`ID da mensagem: ${info.messageId}`);
    console.log(`Resposta: ${JSON.stringify(info.response)}`);
    console.log(`Envelope: ${JSON.stringify(info.envelope)}`);
    return true;
  } catch (error) {
    console.error('\n❌ ERRO AO ENVIAR EMAIL:');
    console.error(`Mensagem: ${error?.message || 'Erro desconhecido'}`);
    console.error(`Código: ${error?.code || 'N/A'}`);
    console.error(`Comando: ${error?.command || 'N/A'}`);
    
    if (error?.response) {
      console.error(`Resposta do servidor: ${error.response}`);
    }
    
    console.log('\n🔄 Usando simulação como fallback...');
    simulateEmailSend(to, subject, html);
    return false;
  }
};

// Interface para entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função principal
const main = async () => {
  console.log('=== DIAGNÓSTICO DO SERVIÇO DE EMAIL ===');
  
  rl.question('Digite o email de destino: ', async (email) => {
    rl.question('Digite o nome do destinatário: ', async (name) => {
      console.log(`\nIniciando diagnóstico para envio de email para ${email}...`);
      
      // Testar conexão SMTP
      try {
        console.log('\nTestando conexão SMTP...');
        const transporter = createTransporter();
        await transporter.verify();
        console.log('✅ Conexão SMTP verificada com sucesso!');
      } catch (error) {
        console.error('❌ Erro na conexão SMTP:', error?.message || 'Erro desconhecido');
        console.log('⚠️ Continuando com o teste usando fallback...');
      }
      
      // Enviar email de teste
      const subject = 'Teste de Diagnóstico - Nosso Templo';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Teste de Diagnóstico</h2>
          <p>Olá ${name},</p>
          <p>Este é um email de diagnóstico do sistema Nosso Templo.</p>
          <p>Data e hora do teste: ${new Date().toLocaleString()}</p>
          <p>Se você está vendo este email, o sistema de envio está funcionando corretamente!</p>
        </div>
      `;
      
      const result = await sendEmail(email, subject, html);
      
      if (result) {
        console.log('\n✅ DIAGNÓSTICO CONCLUÍDO COM SUCESSO!');
        console.log('O email foi enviado corretamente.');
      } else {
        console.log('\n⚠️ DIAGNÓSTICO CONCLUÍDO COM AVISOS!');
        console.log('O email foi enviado usando simulação (fallback) devido a erros.');
      }
      
      rl.close();
    });
  });
};

// Executar o programa
main();
