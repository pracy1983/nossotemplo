// API para envio de emails usando MailerSend
// @esbuild-external:mailersend
const { MailerSend, EmailParams, Recipient, Sender } = require('mailersend');

// Versão da biblioteca MailerSend para logs
const mailersendVersion = require('mailersend/package.json').version || 'desconhecida';
console.log(`=== INICIALIZANDO FUNÇÃO SERVERLESS COM MAILERSEND VERSÃO ${mailersendVersion} ===`);

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
  const apiKey = process.env.MAILERSEND_API_KEY;
  const fromEmail = process.env.MAILERSEND_FROM_EMAIL || 'nossotemplo@aprendamagia.com.br';
  const fromName = process.env.MAILERSEND_FROM_NAME || 'Nosso Templo';
  
  // Verificar se a API key está definida
  if (!apiKey) {
    console.error('ERRO CRÍTICO: MAILERSEND_API_KEY não está definida nas variáveis de ambiente');
    throw new Error('API key do MailerSend não configurada. Configure a variável de ambiente MAILERSEND_API_KEY.');
  }
  
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
    
    // Inicializar o cliente MailerSend conforme a documentação mais recente
    const mailerSend = new MailerSend({
      api_key: config.apiKey
    });
    
    console.log('Cliente MailerSend criado:', {
      hasEmailProperty: !!mailerSend.email,
      clientType: typeof mailerSend
    });
    
    return mailerSend;
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
    console.log('=== INICIANDO FUNÇÃO DE ENVIO DE EMAIL ===');
    console.log('Headers da requisição:', JSON.stringify(event.headers));
    console.log('Método HTTP:', event.httpMethod);
    console.log('Origem da requisição:', event.headers.origin || event.headers.Origin || 'Desconhecida');
    
    // Log detalhado das variáveis de ambiente (sem expor senhas)
    console.log('=== VARIÁVEIS DE AMBIENTE ===');
    const envKeys = Object.keys(process.env).filter(key => 
      !key.includes('KEY') && !key.includes('SECRET') && !key.includes('PASS') && !key.includes('TOKEN')
    );
    console.log('Total de variáveis:', envKeys.length);
    console.log('Variáveis disponíveis:', envKeys);

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
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html);
    
    console.log('Parâmetros de email configurados:', { 
      from: config.fromEmail, 
      fromName: config.fromName,
      to: to, 
      subject: subject 
    });

    // Enviar email
    console.log('=== ENVIANDO EMAIL VIA MAILERSEND ===');
    console.log('Detalhes do email:');
    console.log('- Destinatário:', to);
    console.log('- Assunto:', subject);
    console.log('- Remetente:', config.fromEmail);
    
    // Verificar se o cliente tem a propriedade email
    if (!mailerSend.email) {
      console.error('ERRO CRÍTICO: mailerSend.email não está definido');
      console.log('Estrutura do objeto mailerSend:', Object.keys(mailerSend));
      throw new Error('Cliente MailerSend inicializado incorretamente: propriedade email não encontrada');
    }
    
    // Verificar se o método send existe
    if (typeof mailerSend.email.send !== 'function') {
      console.error('ERRO CRÍTICO: mailerSend.email.send não é uma função');
      console.log('Estrutura do objeto mailerSend.email:', Object.keys(mailerSend.email));
      throw new Error('API MailerSend incompatível: método send não encontrado');
    }
    
    // Verificar se os parâmetros do email estão corretos
    console.log('Parâmetros do email:', {
      from: emailParams.from ? 'definido' : 'indefinido',
      to: emailParams.to ? `definido (${emailParams.to.length} destinatários)` : 'indefinido',
      subject: emailParams.subject ? 'definido' : 'indefinido',
      html: emailParams.html ? 'definido' : 'indefinido'
    });
    
    // Enviar email usando a API correta
    console.log('Chamando mailerSend.email.send()...');
    try {
      // Verificar se o emailParams foi configurado corretamente
      console.log('EmailParams configurado:', {
        from: emailParams.from,
        to: emailParams.to,
        subject: emailParams.subject,
        html: emailParams.html ? 'HTML presente (não exibido por tamanho)' : 'HTML ausente'
      });
      
      // Verificar se o cliente MailerSend está configurado corretamente
      console.log('Estrutura do cliente MailerSend:', {
        clientExists: !!mailerSend,
        emailExists: !!mailerSend?.email,
        sendExists: !!mailerSend?.email?.send,
        sendIsFunction: typeof mailerSend?.email?.send === 'function'
      });
      
      // Log da API key (apenas primeiros e últimos caracteres para segurança)
      const apiKeyLength = apiKey?.length || 0;
      const maskedApiKey = apiKeyLength > 10 ? 
        `${apiKey.substring(0, 5)}...${apiKey.substring(apiKeyLength - 5)}` : 
        'inválida';
      console.log(`API Key configurada (mascarada): ${maskedApiKey}, tamanho: ${apiKeyLength}`);
      
      // Enviar email usando a API correta
      console.log('Iniciando envio de email...');
      const response = await mailerSend.email.send(emailParams);
      
      console.log('Email enviado com sucesso! Resposta:', JSON.stringify(response, null, 2));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Email enviado com sucesso',
          response: response
        })
      };
    } catch (error) {
      console.error('=== ERRO AO ENVIAR EMAIL VIA MAILERSEND ===');
      console.error('Erro original:', error);
      
      // Inspecionar o objeto de erro completamente
      console.error('Tipo de erro:', typeof error);
      console.error('Erro é instância de Error?', error instanceof Error);
      console.error('Propriedades do erro:', Object.keys(error || {}));
      
      if (error?.response) {
        console.error('Erro tem resposta:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      if (error?.request) {
        console.error('Erro tem request:', {
          method: error.request.method,
          path: error.request.path,
          host: error.request.host
        });
      }
      
      // Tentar extrair mais informações do erro
      const errorDetails = {
        message: 'Erro ao enviar email',
        error: `Erro ao enviar email via MailerSend: ${error?.message || JSON.stringify(error)}`,
        errorType: error?.constructor?.name || typeof error,
        isMailerSendError: true,
        timestamp: new Date().toISOString(),
        requestId: event.headers['x-request-id'] || 'unknown',
        code: error?.code || 'unknown',
        response: error?.response?.data || null,
        stack: error?.stack || 'stack indisponível'
      };
      
      console.error('Detalhes completos do erro:', JSON.stringify(errorDetails, null, 2));
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify(errorDetails)
      };
    }
  } catch (error) {
    console.error('=== ERRO GERAL AO PROCESSAR REQUISIÇÃO ===');
    console.error('Tipo de erro:', error.constructor.name);
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    
    // Verificar se é um erro da API MailerSend
    const isMailerSendError = error.message && error.message.includes('MailerSend');
    
    // Criar resposta de erro detalhada
    const errorResponse = {
      message: 'Erro ao enviar email',
      error: error.message,
      errorType: error.constructor.name,
      isMailerSendError: isMailerSendError,
      timestamp: new Date().toISOString(),
      requestId: event.headers['x-request-id'] || 'unknown'
    };
    
    // Adicionar detalhes do erro se disponíveis
    if (error.code) errorResponse.errorCode = error.code;
    if (error.response) {
      errorResponse.apiResponse = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      };
    }
    
    console.error('Resposta de erro que será enviada:', errorResponse);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify(errorResponse)
    };
  }
};
