// API para envio de emails
const nodemailer = require('nodemailer');

// Função para obter variáveis de ambiente (suporta tanto prefixo VITE_ quanto sem prefixo)
const getEnvVar = (name) => {
  const value = process.env[name] || process.env[`VITE_${name}`] || '';
  console.log(`Lendo variável ${name}: ${value ? 'Valor encontrado' : 'Não encontrado'}`);
  return value;
};

// Configuração do SMTP com logs detalhados
const getSmtpConfig = () => {
  const host = getEnvVar('SMTP_HOST') || getEnvVar('EMAIL_HOST') || 'mail.aprendamagia.com.br';
  const port = Number(getEnvVar('SMTP_PORT') || getEnvVar('EMAIL_PORT') || 465);
  const user = getEnvVar('SMTP_USER') || getEnvVar('EMAIL_USER') || 'nossotemplo@aprendamagia.com.br';
  const pass = getEnvVar('SMTP_PASSWORD') || getEnvVar('EMAIL_PASS');
  
  console.log(`Configuração SMTP: host=${host}, port=${port}, user=${user}, pass=${pass ? 'Definida' : 'Não definida'}`);
  
  return {
    host,
    port,
    secure: true,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: true, // Habilita logs de debug do Nodemailer
    logger: true  // Habilita logger do Nodemailer
  };
};

// Criação do transporter sob demanda para evitar problemas de inicialização
const createTransporter = () => {
  const config = getSmtpConfig();
  console.log('Criando transporter com configuração:', JSON.stringify(config, null, 2).replace(/"pass":"[^"]*"/, '"pass":"***"'));
  return nodemailer.createTransport(config);
};

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
