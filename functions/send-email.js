// API para envio de emails usando MailerSend
// @esbuild-external:mailersend
const { MailerSend, EmailParams, Recipient, Sender } = require('mailersend');

// Função para obter variáveis de ambiente (suporta tanto prefixo VITE_ quanto sem prefixo)
const getEnvVar = (name) => {
  const value = process.env[name] || process.env[`VITE_${name}`] || '';
  console.log(`Lendo variável ${name}: ${value ? 'Valor encontrado' : 'Não encontrado'}`);
  return value;
};

// Função para obter configuração do MailerSend
function getMailerSendConfig() {
  // Log completo de todas as variáveis de ambiente disponíveis (sem valores sensíveis)
  console.log('=== TODAS AS VARIÁVEIS DE AMBIENTE DISPONÍVEIS ===');
  const envKeys = Object.keys(process.env);
  console.log('Total de variáveis:', envKeys.length);
  console.log('Nomes das variáveis:', envKeys.filter(key => 
    !key.includes('KEY') && 
    !key.includes('SECRET') && 
    !key.includes('PASS') && 
    !key.includes('PASSWORD') && 
    !key.includes('TOKEN')
  ));
  
  // Verificar especificamente as variáveis do MailerSend
  console.log('=== VERIFICAÇÃO DE VARIÁVEIS MAILERSEND ===');
  console.log('MAILERSEND_API_KEY existe:', !!process.env.MAILERSEND_API_KEY);
  console.log('MAILERSEND_FROM_EMAIL existe:', !!process.env.MAILERSEND_FROM_EMAIL);
  console.log('MAILERSEND_FROM_NAME existe:', !!process.env.MAILERSEND_FROM_NAME);
  
  // Obter configuração do MailerSend das variáveis de ambiente
  const apiKey = process.env.MAILERSEND_API_KEY || 'mlsn.ca9538bfcab045c4e4163b83dc6b86e60e115acd0039606337f9146a3148e02b';
  const fromEmail = process.env.MAILERSEND_FROM_EMAIL || 'nossotemplo@aprendamagia.com.br';
  const fromName = process.env.MAILERSEND_FROM_NAME || 'Nosso Templo';
  
  // Log dos valores que serão usados (sem exibir a API key completa)
  console.log('=== CONFIGURAÇÃO MAILERSEND QUE SERÁ USADA ===');
  console.log('API Key definida:', !!apiKey);
  console.log('API Key primeiros caracteres:', apiKey ? apiKey.substring(0, 10) + '***' : 'Não definido');
  console.log('From Email:', fromEmail);
  console.log('From Name:', fromName);
  
  return {
    apiKey,
    fromEmail,
    fromName
  };
}

// Função para criar o cliente MailerSend
function createMailerSendClient() {
  try {
    // Obter configuração do MailerSend
    const config = getMailerSendConfig();
    
    console.log('Criando cliente MailerSend com configuração:', {
      apiKeyDefined: !!config.apiKey,
      fromEmail: config.fromEmail,
      fromName: config.fromName
    });
    
    return new MailerSend({
      apiKey: config.apiKey
    });
  } catch (error) {
    console.error('Erro ao criar cliente MailerSend:', error);
    return null;
  }
}

// Handler para a requisição POST
exports.handler = async (event, context) => {
  // Adicionar headers para CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Tratar preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    console.log('Iniciando função de envio de email com MailerSend...');
    console.log('Headers da requisição:', JSON.stringify(event.headers));
    console.log('Método HTTP:', event.httpMethod);
    
    // Log das variáveis de ambiente (sem expor senhas)
    console.log('Variáveis de ambiente disponíveis:', Object.keys(process.env).filter(key => 
      !key.includes('KEY') && !key.includes('SECRET') && !key.includes('PASS') && !key.includes('TOKEN')
    ));

    // Verificar método
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ message: 'Método não permitido' })
      };
    }

    // Obter dados do corpo da requisição
    let parsedBody;
    try {
      parsedBody = JSON.parse(event.body);
      console.log('Corpo da requisição parseado com sucesso');
    } catch (e) {
      console.error('Erro ao parsear corpo da requisição:', e);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Corpo da requisição inválido', error: e.message })
      };
    }

    const { to, subject, html, from } = parsedBody;
    console.log(`Tentando enviar email para: ${to}`);

    // Validar dados
    if (!to || !subject || !html) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ message: 'Dados incompletos' })
      };
    }

    // Criar cliente MailerSend
    const mailerSend = createMailerSendClient();
    
    // Verificar se o cliente foi criado corretamente
    if (!mailerSend) {
      console.error('Falha ao criar cliente MailerSend');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: 'Falha ao criar cliente de email' })
      };
    }

    // Obter configuração do MailerSend
    const config = getMailerSendConfig();
    
    // Configurar email usando MailerSend
    console.log('Configurando email com MailerSend...');
    
    // Criar remetente
    const sentFrom = new Sender(config.fromEmail, config.fromName);
    
    // Criar destinatário
    const recipients = [new Recipient(to)];
    
    // Criar parâmetros do email
    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setRecipients(recipients)
      .setSubject(subject)
      .setHtml(html);
    
    console.log('Parâmetros de email configurados:', { 
      from: config.fromEmail, 
      fromName: config.fromName,
      to: to, 
      subject: subject 
    });

    // Enviar email
    console.log('Enviando email via MailerSend...');
    const response = await mailerSend.send(emailParams);

    console.log('Email enviado com sucesso:', response);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Email enviado com sucesso',
        response: response
      })
    };
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        message: 'Erro ao enviar email',
        error: error.message,
        stack: error.stack
      })
    };
  }
};
