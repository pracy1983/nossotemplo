// functions/send-email.js
import nodemailer from 'nodemailer';

export async function handler(event, context) {
  try {
    console.log("[SEND-EMAIL] SMTP function called.");

    const { to, subject, html } = JSON.parse(event.body);
    console.log("Payload received:", { to, subject });

    // Verificar se as variáveis de ambiente SMTP estão definidas
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Variáveis de ambiente SMTP não estão configuradas corretamente.");
      return {
        statusCode: 500,
        body: JSON.stringify({ message: "Configuração SMTP incompleta no servidor." })
      };
    }

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: parseInt(process.env.EMAIL_PORT, 10) === 465, // true for 465, false for others
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Log de configuração (sem mostrar senha)
    console.log("SMTP Configuration:", {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: parseInt(process.env.EMAIL_PORT, 10) === 465,
      user: process.env.EMAIL_USER
    });

    // Send mail
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'Nosso Templo <nossotemplo@aprendamagia.com.br>',
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
