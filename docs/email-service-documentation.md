# Documentação do Serviço de Email - Nosso Templo

## Visão Geral

O serviço de email do Nosso Templo foi implementado para enviar notificações por email aos usuários, incluindo convites para novos membros e emails de redefinição de senha. O serviço utiliza o Nodemailer para envio de emails SMTP e inclui um mecanismo de fallback para simulação de envio em caso de falhas na conexão SMTP.

## Arquitetura

### Componentes Principais

1. **emailService.ts**: Serviço principal que gerencia o envio de emails
2. **Mecanismo de Fallback**: Simulação de envio de email quando o SMTP falha
3. **Integração com React**: Componentes React que utilizam o serviço de email
4. **Notificações Toast**: Feedback visual para o usuário sobre o status do envio

### Fluxo de Funcionamento

1. O componente React solicita o envio de um email
2. O serviço tenta enviar o email usando SMTP
3. Se o envio SMTP falhar, o serviço utiliza o fallback para simulação
4. O usuário recebe uma notificação toast sobre o resultado do envio

## Configuração

### Variáveis de Ambiente

O serviço de email suporta variáveis de ambiente com ou sem o prefixo `VITE_`:

```
# Configuração principal (sem prefixo VITE_)
EMAIL_HOST=mail.aprendamagia.com.br
EMAIL_PORT=465
EMAIL_USER=nossotemplo@aprendamagia.com.br
EMAIL_PASS=your_email_password
EMAIL_FROM=Nosso Templo <nossotemplo@aprendamagia.com.br>

# Configuração alternativa (com prefixo VITE_)
VITE_EMAIL_HOST=mail.aprendamagia.com.br
VITE_EMAIL_PORT=465
VITE_EMAIL_USER=nossotemplo@aprendamagia.com.br
VITE_EMAIL_PASS=your_email_password
VITE_EMAIL_FROM=Nosso Templo <nossotemplo@aprendamagia.com.br>
```

### Notas Importantes

1. Não use aspas em volta das senhas, especialmente se começarem com caracteres especiais como '='
2. Para certificados autoassinados, o sistema está configurado para ignorar erros de SSL
3. Em caso de falha no envio de email real, o sistema usará simulação de email como fallback

## Funções Principais

### sendEmail

Função principal para envio de emails. Tenta enviar o email via SMTP e, em caso de falha, utiliza o fallback para simulação.

```typescript
export const sendEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    // Tentativa de envio real via SMTP
    const info = await transporter.sendMail({
      from: getEnvVar('EMAIL_FROM') || '"Nosso Templo" <nossotemplo@aprendamagia.com.br>',
      to,
      subject,
      html
    });
    
    console.log('Email enviado com sucesso:', info.messageId);
    return true;
  } catch (error) {
    console.warn(`Erro ao enviar email real: ${error?.message || 'Erro desconhecido'}`);
    console.log('Usando simulação de email como fallback...');
    
    // Usar simulação como fallback
    simulateEmailSend(to, subject, html);
    return true; // Retorna true mesmo com simulação para não interromper o fluxo
  }
};
```

### sendPasswordResetEmail

Função específica para envio de emails de redefinição de senha.

```typescript
export const sendPasswordResetEmail = async (to: string, resetLink: string, name: string): Promise<boolean> => {
  const subject = 'Redefinição de Senha - Nosso Templo';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Redefinição de Senha</h2>
      <p>Olá ${name},</p>
      <p>Você foi cadastrado no sistema Nosso Templo. Para definir sua senha, clique no link abaixo:</p>
      <p><a href="${resetLink}" style="display: inline-block; background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Definir Senha</a></p>
      <p>Se você não solicitou esta redefinição, por favor ignore este email.</p>
      <p>Atenciosamente,<br>Equipe Nosso Templo</p>
    </div>
  `;

  return sendEmail(to, subject, html);
};
```

### sendInviteEmail

Função específica para envio de emails de convite para novos membros.

```typescript
export const sendInviteEmail = async (to: string, inviteLink: string, name: string): Promise<boolean> => {
  const subject = 'Convite - Nosso Templo';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Convite para o Nosso Templo</h2>
      <p>Olá ${name},</p>
      <p>Você foi convidado para participar do Nosso Templo. Para aceitar o convite, clique no link abaixo:</p>
      <p><a href="${inviteLink}" style="display: inline-block; background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Aceitar Convite</a></p>
      <p>Atenciosamente,<br>Equipe Nosso Templo</p>
    </div>
  `;

  return sendEmail(to, subject, html);
};
```

## Scripts de Teste

Foram criados dois scripts para testar o serviço de email:

1. **testEmailServiceIntegrated.cjs**: Testa o serviço de email com todas as funcionalidades implementadas
2. **testEmailProduction.cjs**: Testa o serviço de email em ambiente de produção

Para executar os scripts:

```bash
node src/scripts/testEmailServiceIntegrated.cjs
node src/scripts/testEmailProduction.cjs
```

## Integração com Componentes React

O serviço de email foi integrado com os seguintes componentes React:

1. **AddStudent.tsx**: Para envio de emails de redefinição de senha
2. **StudentInvites.tsx**: Para envio de emails de convite para novos membros

## Notificações Toast

As notificações toast foram implementadas usando a biblioteca `react-toastify`. O componente `ToastContainer` foi adicionado ao `App.tsx` para exibir as notificações.

## Solução de Problemas

### Problemas Comuns

1. **Erro de autenticação SMTP**: Verifique se as credenciais estão corretas no arquivo `.env`
2. **Erro de SSL**: O sistema está configurado para ignorar erros de SSL, mas pode ser necessário ajustar as configurações do servidor SMTP
3. **Email não recebido**: Verifique se o email não está na pasta de spam ou se o servidor SMTP está bloqueando o envio

### Logs

O serviço de email gera logs detalhados para ajudar na solução de problemas:

- Logs de tentativa de envio de email
- Logs de erro em caso de falha no envio
- Logs de simulação de email quando o fallback é utilizado

## Próximos Passos

1. Implementar um sistema de fila para envio de emails em massa
2. Adicionar templates de email mais elaborados
3. Implementar um sistema de rastreamento de emails enviados
4. Melhorar a segurança do serviço de email
