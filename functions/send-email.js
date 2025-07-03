import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';

export async function handler(event, context) {
  try {
    console.log("[SEND-EMAIL] Função chamada");
    console.log("MAILERSEND_API_KEY:", process.env.MAILERSEND_API_KEY ? "DEFINIDA" : "NÃO DEFINIDA");

    const { to, subject, html } = JSON.parse(event.body);
    console.log("Payload recebido:", { to, subject });

    const mailersend = new MailerSend({ apiKey: process.env.MAILERSEND_API_KEY });
    const sentFrom = new Sender(process.env.MAILERSEND_FROM_EMAIL, process.env.MAILERSEND_FROM_NAME || "Nosso Templo");
    const recipients = [new Recipient(to, "")];

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipients)
      .setSubject(subject)
      .setHtml(html);

    const response = await mailersend.email.send(emailParams);
    console.log("Email enviado com sucesso:", response);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email enviado com sucesso.", response })
    };
  } catch (error) {
    console.error("Erro completo:", JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Erro ao enviar email.",
        error: error.message,
        fullError: JSON.stringify(error, null, 2),
        stack: error.stack
      })
    };
  }
}
