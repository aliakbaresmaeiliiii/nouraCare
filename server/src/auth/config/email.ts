import nodemailer from 'nodemailer';
import mg from 'nodemailer-mailgun-transport';
import dotenv from 'dotenv';
import { BadGatewayException } from '@nestjs/common';
import { APP_BRAND_NAME } from '../../constants/app-brand.constants';

dotenv.config(); // Load environment variables

const {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_USERNAME,
  MAIL_PASSWORD,
  MAILGUN_API_KEY,
  MAILGUN_DOMAIN,
} = process.env;

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

    return nodemailer.createTransport({
      host: MAIL_HOST || 'localhost',
      port: Number(MAIL_PORT || 587),
      secure: Number(MAIL_PORT) === 465,
      auth:
        MAIL_USERNAME && MAIL_PASSWORD
          ? {
              user: MAIL_USERNAME,
              pass: MAIL_PASSWORD,
            }
          : undefined,
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
      throw new BadGatewayException(
        'Failed to send email — check MAIL_* SMTP settings on the server',
      );
    }
  }
}
