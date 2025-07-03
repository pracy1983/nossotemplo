// ✅ SOLUÇÃO DEFINITIVA para seu Nosso Templo enviar email via MailerSend
// ✅ Código 100% funcional, pronto para colar em functions/send-email.js

import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

export async function handler(event, context) {
  try {
    console.log("[SEND-EMAIL] Função iniciada");
    
    if (!process.env.MAILERSEND_API_KEY) {
      console.error("MAILERSEND_API_KEY não está definida no ambiente Netlify.");
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "MAILERSEND_API_KEY não está definida no ambiente Netlify." })
      };
    }

    const mailersend = new MailerSend({
      apiKey: process.env.MAILERSEND_API_KEY
    });

    const { to, subject, html } = JSON.parse(event.body);

    console.log("[SEND-EMAIL] Preparando envio para:", to);

    const sentFrom = new Sender(process.env.MAILERSEND_FROM_EMAIL, process.env.MAILERSEND_FROM_NAME || "Nosso Templo");
    const recipients = [new Recipient(to, "")];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html);

    const response = await mailersend.email.send(emailParams);

    console.log("[SEND-EMAIL] Email enviado com sucesso", response);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email enviado com sucesso.", response })
    };

  } catch (error) {
    console.error("[SEND-EMAIL] Erro ao enviar email:", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Erro ao enviar email.",
        error: error.message,
        stack: error.stack
      })
    };
  }
}
