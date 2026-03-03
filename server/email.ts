import nodemailer from 'nodemailer';

const transporter = process.env.SMTP_USER && process.env.SMTP_PASS
  ? nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
  : null;

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  baseUrl: string
): Promise<boolean> {
  if (!transporter) {
    console.error('SMTP_USER e SMTP_PASS non configurate');
    return false;
  }

  const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: to,
      subject: 'Reset Password - Trading Journal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Reset della Password</h2>
          <p>Hai richiesto il reset della password per il tuo account Trading Journal.</p>
          <p>Clicca sul pulsante qui sotto per impostare una nuova password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #0066cc; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Reimposta Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            Questo link scadrà tra 1 ora.<br>
            Se non hai richiesto il reset, ignora questa email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Trading Journal</p>
        </div>
      `,
    });

    console.log('Email di reset password inviata a:', to);
    return true;
  } catch (error) {
    console.error('Errore invio email:', error);
    return false;
  }
}

export async function sendAdminResetPasswordEmail(
  to: string,
  tempPassword: string,
  baseUrl: string
): Promise<boolean> {
  if (!transporter) {
    console.error('SMTP_USER e SMTP_PASS non configurate — impossibile inviare la password temporanea');
    return false;
  }

  const loginLink = `${baseUrl}/login`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: to,
      subject: 'Password Resettata - Trading Journal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">La tua password è stata resettata</h2>
          <p>Un amministratore ha resettato la password del tuo account Trading Journal.</p>
          <p>La tua nuova password temporanea è:</p>
          <div style="text-align: center; margin: 20px 0; padding: 16px; background-color: #f5f5f5; border-radius: 8px;">
            <code style="font-size: 18px; font-weight: bold; letter-spacing: 1px;">${tempPassword}</code>
          </div>
          <p><strong>Importante:</strong> Cambia questa password immediatamente dopo il primo accesso.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginLink}" 
               style="background-color: #0066cc; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Accedi ora
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">Trading Journal</p>
        </div>
      `,
    });

    console.log('Email di reset password admin inviata a:', to);
    return true;
  } catch (error) {
    console.error('Errore invio email reset admin:', error);
    return false;
  }
}
