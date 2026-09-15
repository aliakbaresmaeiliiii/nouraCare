import nodemailer from 'nodemailer';
import mg from 'nodemailer-mailgun-transport';
import dotenv from 'dotenv';
import { BadGatewayException } from '@nestjs/common';
import { APP_BRAND_NAME } from '../../constants/app-brand.constants';

dotenv.config(); // Load environment variables

function stripEnvQuotes(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '');
}

const MAIL_HOST = stripEnvQuotes(process.env.MAIL_HOST);
const MAIL_PORT = Number(stripEnvQuotes(process.env.MAIL_PORT) || 587);
const MAIL_USERNAME = stripEnvQuotes(process.env.MAIL_USERNAME);
const MAIL_PASSWORD = stripEnvQuotes(process.env.MAIL_PASSWORD);
const MAILGUN_API_KEY = stripEnvQuotes(process.env.MAILGUN_API_KEY);
const MAILGUN_DOMAIN = stripEnvQuotes(process.env.MAILGUN_DOMAIN);

const isMailgunAPI = Boolean(MAILGUN_API_KEY && MAILGUN_DOMAIN);

export class EmailProvider {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = this.createTransporter();
  }

  /**
   * Create and configure the mail transporter
   */
  private createTransporter(): nodemailer.Transporter {
    if (isMailgunAPI) {
      return nodemailer.createTransport(
        mg({
          auth: {
            api_key: MAILGUN_API_KEY,
            domain: MAILGUN_DOMAIN,
          },
        }),
      );
    }

    const secure = MAIL_PORT === 465;

    return nodemailer.createTransport({
      host: MAIL_HOST || '127.0.0.1',
      port: MAIL_PORT,
      secure,
      requireTLS: !secure && MAIL_PORT === 587,
      auth:
        MAIL_USERNAME && MAIL_PASSWORD
          ? {
              user: MAIL_USERNAME,
              pass: MAIL_PASSWORD,
            }
          : undefined,
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 12_000,
    });
  }

  /**
   * Sends an email
   */
  public async send(to: string | string[], subject: string, template: string) {
    return this.sendMail({
      to,
      subject,
      html: template,
    });
  }

  public async sendMail(options: {
    to: string | string[];
    subject: string;
    html: string;
    attachments?: nodemailer.Attachment[];
  }) {
    if (!isMailgunAPI && (!MAIL_HOST || !MAIL_USERNAME || !MAIL_PASSWORD)) {
      throw new BadGatewayException(
        'Email is not configured (MAIL_HOST / MAIL_USERNAME / MAIL_PASSWORD)',
      );
    }

    try {
      const recipient = Array.isArray(options.to)
        ? options.to.join(', ')
        : options.to;
      const mailOptions: nodemailer.SendMailOptions = {
        from: `${APP_BRAND_NAME} <${MAIL_USERNAME}>`,
        to: recipient,
        subject: options.subject,
        html: options.html,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error('❌ Error sending email:', error);
      if (error instanceof BadGatewayException) {
        throw error;
      }
      const detail =
        error instanceof Error ? error.message : 'unknown SMTP error';
      throw new BadGatewayException(
        `Failed to send email (${detail}). Check MAIL_* on the server.`,
      );
    }
  }
}
