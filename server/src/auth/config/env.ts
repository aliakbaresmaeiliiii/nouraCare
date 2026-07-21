import * as dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}. Set it before running in production.`,
    );
  }
  return value.trim();
}

const isProduction = process.env.NODE_ENV === 'production';

const jwtSecret = process.env.JWT_SECRET?.trim();
const dbPassword = process.env.DB_PASSWORD?.trim();

if (isProduction) {
  requireEnv('JWT_SECRET', jwtSecret);
  requireEnv('DB_PASSWORD', dbPassword);
}

function parseCsv(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const env = {
  PORT: Number(process.env.PORT || 3000),
  HOST: process.env.HOST || '0.0.0.0',
  DB_HOST: process.env.DB_HOST || '127.0.0.1',
  DB_PORT: Number(process.env.DB_PORT || 3306),
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: dbPassword || '',
  DB_NAME: process.env.DB_NAME || 'dorehealth',
  JWT_SECRET:
    jwtSecret ||
    (isProduction ? '' : 'dev-only-change-me-not-for-production'),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGINS: parseCsv(process.env.CORS_ORIGINS),
  GOOGLE_CLIENT_IDS: parseCsv(
    process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_WEB_CLIENT_ID,
  ),
  APPLE_CLIENT_IDS: parseCsv(process.env.APPLE_CLIENT_IDS),
  /**
   * When false, verified users can sign in with email alone.
   * Continue-with-email still auto-registers unknown emails and requires OTP for those
   * (and for any unverified account). Set EMAIL_OTP_ENABLED=true to require OTP for
   * all email sign-ins.
   */
  EMAIL_OTP_ENABLED: process.env.EMAIL_OTP_ENABLED === 'true',

  /** sms.ir — API key from panel (X-API-KEY). Never expose to the client. */
  SMS_IR_API_KEY: process.env.SMS_IR_API_KEY?.trim() || '',
  SMS_IR_LINE_NUMBER: Number(process.env.SMS_IR_LINE_NUMBER || 0),
  /**
   * Optional verify-template ID from sms.ir panel.
   * When set (>0), OTP uses sendVerifyCode; otherwise plain sendBulk text.
   */
  SMS_IR_VERIFY_TEMPLATE_ID: Number(process.env.SMS_IR_VERIFY_TEMPLATE_ID || 0),
  /** Template placeholder name (default Code). */
  SMS_IR_VERIFY_PARAM_NAME:
    process.env.SMS_IR_VERIFY_PARAM_NAME?.trim() || 'Code',
  /** Bulk SMS body; use {code} for the OTP. */
  SMS_OTP_MESSAGE_TEMPLATE:
    process.env.SMS_OTP_MESSAGE_TEMPLATE?.trim() ||
    'کد ورود دُرهِلث: {code}',
  /**
   * When true, skip email OTP if SMS was sent successfully.
   * Default false — send both when phone + SMS are available.
   */
  SMS_OTP_SKIP_EMAIL: process.env.SMS_OTP_SKIP_EMAIL === 'true',
  /** When true, fail the request if SMS send fails (and phone was required). */
  SMS_STRICT: process.env.SMS_STRICT === 'true',
};
