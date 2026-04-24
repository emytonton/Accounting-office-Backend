import nodemailer from 'nodemailer';
import { env } from '../../config/env';

export interface IEmailService {
  sendVerificationCode(to: string, code: string, isFirstAccess: boolean): Promise<void>;
}

// Used in tests and when SMTP is not configured
export class ConsoleEmailService implements IEmailService {
  public readonly sent: Array<{ to: string; code: string; isFirstAccess: boolean }> = [];

  async sendVerificationCode(to: string, code: string, isFirstAccess: boolean): Promise<void> {
    this.sent.push({ to, code, isFirstAccess });
    const action = isFirstAccess ? 'primeiro acesso' : 'redefinição de senha';
    console.log(`[EMAIL] To: ${to} | Código (${action}): ${code} | Expires: 24h`);
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

  async sendVerificationCode(to: string, code: string, isFirstAccess: boolean): Promise<void> {
    const subject = isFirstAccess
      ? `${env.APP_NAME} — Código de primeiro acesso`
      : `${env.APP_NAME} — Código de redefinição de senha`;

    await this.transporter.sendMail({
      from: `"${env.APP_NAME}" <${env.SMTP_FROM}>`,
      to,
      subject,
      html: buildEmailHtml({ subject, code, isFirstAccess, appName: env.APP_NAME }),
    });

    console.log(`[EMAIL] Sent to: ${to}`);
  }
}

function buildEmailHtml(params: {
  subject: string;
  code: string;
  isFirstAccess: boolean;
  appName: string;
}): string {
  const { subject, code, isFirstAccess, appName } = params;
  const body = isFirstAccess
    ? 'Você foi convidado para acessar o sistema. Use o código abaixo para definir sua senha.'
    : 'Recebemos uma solicitação para redefinir sua senha. Use o código abaixo para continuar.';

  return `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#1a1a1a">${appName}</h2>
      <h3 style="color:#333">${subject}</h3>
      <p style="color:#555;line-height:1.6">${body}</p>
      <div style="margin:32px 0;text-align:center">
        <span style="display:inline-block;padding:16px 40px;background:#f1f5f9;
                     border-radius:8px;font-size:36px;font-weight:bold;
                     letter-spacing:8px;color:#1a1a1a">
          ${code}
        </span>
      </div>
      <p style="margin-top:32px;color:#888;font-size:12px">
        Este código expira em <strong>24 horas</strong> e só pode ser usado uma vez.<br>
        Se você não solicitou isso, ignore este e-mail.
      </p>
    </div>
  `;
}

export const consoleEmailService = new ConsoleEmailService();

// Uses Nodemailer when SMTP is configured, otherwise falls back to console.
// Always uses console in test environment so tests never hit real SMTP.
export const emailService: IEmailService =
  env.NODE_ENV !== 'test' && env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS
    ? new NodemailerEmailService()
    : consoleEmailService;
