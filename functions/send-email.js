// functions/send-email.js
import nodemailer from 'nodemailer';

export async function handler(event, context) {
  try {
    console.log("[SEND-EMAIL] SMTP function called.");

    const { to, subject, html } = JSON.parse(event.body);
    console.log("Payload received:", { to, subject });

    // Verificar se as variáveis de ambiente SMTP estão definidas
    if (!process.env.MAILERSEND_SMTP_SERVER || !process.env.MAILERSEND_SMTP_USERNAME || !process.env.MAILERSEND_SMTP_PASSWORD) {
      console.error("Variáveis de ambiente SMTP não estão configuradas corretamente.");
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Configuração SMTP incompleta no servidor." })
      };
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.MAILERSEND_SMTP_SERVER,
      port: parseInt(process.env.MAILERSEND_SMTP_PORT, 10),
      secure: parseInt(process.env.MAILERSEND_SMTP_PORT, 10) === 465, // true for 465, false for others
      auth: {
        user: process.env.MAILERSEND_SMTP_USERNAME,
        pass: process.env.MAILERSEND_SMTP_PASSWORD,
      },
    });

    // Log de configuração (sem mostrar senha)
    console.log("SMTP Configuration:", {
      host: process.env.MAILERSEND_SMTP_SERVER,
      port: process.env.MAILERSEND_SMTP_PORT,
      secure: parseInt(process.env.MAILERSEND_SMTP_PORT, 10) === 465,
      user: process.env.MAILERSEND_SMTP_USERNAME,
      from: process.env.MAILERSEND_FROM_EMAIL
    });

    // Send mail
    const info = await transporter.sendMail({
      from: `"${process.env.MAILERSEND_FROM_NAME || "Nosso Templo"}" <${process.env.MAILERSEND_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully:", info);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Email enviado com sucesso via SMTP.", info }),
    };
  } catch (error) {
    console.error("Erro ao enviar email via SMTP:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Erro ao enviar email via SMTP.",
        error: error.message,
        stack: error.stack,
      }),
    };
  }
}
