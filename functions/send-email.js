// API para envio de emails
const nodemailer = require('nodemailer');

// Função para obter variáveis de ambiente (suporta tanto prefixo VITE_ quanto sem prefixo)
const getEnvVar = (name) => {
  const value = process.env[name] || process.env[`VITE_${name}`] || '';
  console.log(`Lendo variável ${name}: ${value ? 'Valor encontrado' : 'Não encontrado'}`);
  return value;
};

// Função para obter configuração SMTP das variáveis de ambiente
function getSmtpConfig() {
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
  
  // Verificar especificamente as variáveis SMTP
  console.log('=== VERIFICAÇÃO DE VARIÁVEIS SMTP ===');
  console.log('SMTP_HOST existe:', !!process.env.SMTP_HOST);
  console.log('EMAIL_HOST existe:', !!process.env.EMAIL_HOST);
  console.log('SMTP_PORT existe:', !!process.env.SMTP_PORT);
  console.log('EMAIL_PORT existe:', !!process.env.EMAIL_PORT);
  console.log('SMTP_USER existe:', !!process.env.SMTP_USER);
  console.log('EMAIL_USER existe:', !!process.env.EMAIL_USER);
  console.log('SMTP_PASSWORD existe:', !!process.env.SMTP_PASSWORD);
  console.log('EMAIL_PASS existe:', !!process.env.EMAIL_PASS);
  
  // Tentar obter configuração SMTP das variáveis de ambiente
  // Suporta tanto variáveis com prefixo SMTP_ quanto EMAIL_
  const host = process.env.SMTP_HOST || process.env.EMAIL_HOST || 'mail.aprendamagia.com.br';
  const port = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '465', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER || 'nossotemplo@aprendamagia.com.br';
  
  // IMPORTANTE: Usar senha fixa para teste se não encontrar nas variáveis de ambiente
  const pass = process.env.SMTP_PASSWORD || process.env.EMAIL_PASS || 'R5koP*sRbQtP';
  
  // Log dos valores que serão usados (sem exibir a senha completa)
  console.log('=== CONFIGURAÇÃO SMTP QUE SERÁ USADA ===');
  console.log('Host:', host);
  console.log('Port:', port);
  console.log('User:', user);
  console.log('Pass definido:', !!pass);
  console.log('Pass primeiros caracteres:', pass ? pass.substring(0, 3) + '***' : 'Não definido');
  console.log('Secure:', port === 465);
  
  return {
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true,
    logger: true
  };
}

// Função para criar o transporter sob demanda
function createTransporter() {
  try {
    // Obter configuração SMTP
    const config = getSmtpConfig();
    
    console.log('Criando transporter com configuração:', {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth.user,
      tls: config.tls,
      debug: config.debug
    });
    
    return nodemailer.createTransport(config);
  } catch (error) {
    console.error('Erro ao criar transporter:', error);
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
    console.log('Iniciando função de envio de email...');
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

    // Criar transporter sob demanda
    const transporter = createTransporter();
    
    // Verificar se o transporter foi criado corretamente
    if (!transporter) {
      console.error('Falha ao criar transporter');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: 'Falha ao criar transporter de email' })
      };
    }

    // Verificar conexão SMTP
    try {
      console.log('Verificando conexão SMTP...');
      await new Promise((resolve, reject) => {
        transporter.verify(function (error, success) {
          if (error) {
            console.error('Erro na verificação SMTP:', error);
            reject(error);
          } else {
            console.log('Servidor SMTP pronto para enviar mensagens');
            resolve(success);
          }
        });
      });
    } catch (verifyError) {
      console.error('Falha na verificação SMTP:', verifyError);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          message: 'Falha na conexão com servidor SMTP', 
          error: verifyError.message 
        })
      };
    }

    // Configurar email
    const mailOptions = {
      from: from || '"Nosso Templo" <nossotemplo@aprendamagia.com.br>',
      to,
      subject,
      html
    };
    
    console.log('Opções de email configuradas:', { 
      from: mailOptions.from, 
      to: mailOptions.to, 
      subject: mailOptions.subject 
    });

    // Enviar email
    console.log('Enviando email...');
    const info = await transporter.sendMail(mailOptions);

    console.log('Email enviado com sucesso:', info.messageId);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Email enviado com sucesso',
        messageId: info.messageId
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
