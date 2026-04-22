import { app } from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`[${env.APP_NAME}] Server running on port ${env.PORT} — ${env.NODE_ENV}`);
  const emailMode = env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS ? 'SMTP (Nodemailer)' : 'Console only (SMTP not configured)';
  console.log(`[EMAIL] Mode: ${emailMode}`);
});
