import nodemailer from 'nodemailer';
import { env } from '../../config/env';

export interface IEmailService {
  sendPasswordResetLink(to: string, token: string, isFirstAccess: boolean): Promise<void>;
}

// Used in tests and when SMTP is not configured
export class ConsoleEmailService implements IEmailService {
  public readonly sent: Array<{ to: string; token: string; isFirstAccess: boolean }> = [];

  async sendPasswordResetLink(to: string, token: string, isFirstAccess: boolean): Promise<void> {
    this.sent.push({ to, token, isFirstAccess });
    const action = isFirstAccess ? 'first-access' : 'reset-password';
    console.log(`[EMAIL] To: ${to} | Link: /auth/${action}?token=${token} | Expires: 24h`);
  }
}

export class NodemailerEmailService implements IEmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async sendPasswordResetLink(to: string, token: string, isFirstAccess: boolean): Promise<void> {
    const action = isFirstAccess ? 'first-access' : 'reset-password';
    const link = `${env.APP_URL}/auth/${action}?token=${token}`;
    const subject = isFirstAccess
      ? `${env.APP_NAME} — Defina sua senha de acesso`
      : `${env.APP_NAME} — Redefinição de senha`;

    await this.transporter.sendMail({
      from: `"${env.APP_NAME}" <${env.SMTP_FROM}>`,
      to,
      subject,
      html: buildEmailHtml({ subject, link, isFirstAccess, appName: env.APP_NAME }),
    });

    console.log(`[EMAIL] Sent to: ${to}`);
  }
}

function buildEmailHtml(params: {
  subject: string;
  link: string;
  isFirstAccess: boolean;
  appName: string;
}): string {
  const { subject, link, isFirstAccess, appName } = params;
  const action = isFirstAccess ? 'Definir minha senha' : 'Redefinir minha senha';
  const body = isFirstAccess
    ? 'Você foi convidado para acessar o sistema. Clique no botão abaixo para definir sua senha.'
    : 'Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para continuar.';

  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#1a1a1a">${appName}</h2>
      <h3 style="color:#333">${subject}</h3>
      <p style="color:#555;line-height:1.6">${body}</p>
      <a href="${link}"
         style="display:inline-block;margin-top:24px;padding:12px 24px;background:#2563eb;
                color:#fff;text-decoration:none;border-radius:6px;font-weight:bold">
        ${action}
      </a>
      <p style="margin-top:32px;color:#888;font-size:12px">
        Este link expira em <strong>24 horas</strong> e só pode ser usado uma vez.<br>
        Se você não solicitou isso, ignore este e-mail.
      </p>
    </div>
  `;
}

export const consoleEmailService = new ConsoleEmailService();

// Uses Nodemailer when SMTP is configured, otherwise falls back to console
export const emailService: IEmailService =
  env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
    ? new NodemailerEmailService()
    : consoleEmailService;
