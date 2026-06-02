import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs/promises';
import { BadGatewayException, UnauthorizedException } from '@nestjs/common';
import { EmailProvider } from 'src/auth/config/email';
import {
  getOtpEmailContent,
  normalizeEmailLocale,
  OtpEmailPurpose,
} from './email-translations';
import { APP_BRAND_NAME } from '../constants/app-brand.constants';

class SendMail {
  private emailProvider: EmailProvider;

  constructor(emailProvider: EmailProvider) {
    this.emailProvider = emailProvider;
  }

  private async loadTemplate(
    templateName: string,
    data: Record<string, string | number>,
  ): Promise<string> {
    try {
      const templatePath = path.resolve(
        __dirname,
        `../../../public/template/email/${templateName}.html`,
      );
      const html = await fs.readFile(templatePath, 'utf8');
      const template = handlebars.compile(html);
      return template(data);
    } catch (error) {
      console.error(`Error loading email template (${templateName}):`, error);
      throw new BadGatewayException('Email template not found');
    }
  }

  public async sendAccountRegister(
    email: string,
    verifyCode: string,
    options?: {
      locale?: string | null;
      purpose?: OtpEmailPurpose;
    },
  ) {
    try {
      const appName = APP_BRAND_NAME;
      const locale = normalizeEmailLocale(options?.locale);
      const purpose = options?.purpose ?? 'verification';
      const content = getOtpEmailContent(locale, purpose, {
        appName,
        token: verifyCode,
        year: new Date().getFullYear(),
      });
      const textAlign = content.dir === 'rtl' ? 'right' : 'left';

      const htmlToSend = await this.loadTemplate('emailverify', {
        LANG: content.lang,
        DIR: content.dir,
        TEXT_ALIGN: textAlign,
        APP_NAME: appName,
        TOKEN: verifyCode,
        PREHEADER: content.preheader,
        BADGE: content.badge,
        HEADLINE: content.headline,
        GREETING: content.greeting,
        BODY: content.body,
        CODE_LABEL: content.codeLabel,
        EXPIRY: content.expiry,
        CLOSING: content.closing,
        TEAM_NAME: content.teamName,
        FOOTER_NOTE: content.footerNote,
        COPYRIGHT: content.copyright,
      });

      await this.emailProvider.send(email, content.subject, htmlToSend);
    } catch (error) {
      console.error('Error sending registration email:', error);
      throw new UnauthorizedException('Failed to send email');
    }
  }

  public async sendDataExport(
    email: string,
    fullName: string,
    jsonPayload: string,
    filename: string,
  ) {
    try {
      const htmlToSend = await this.loadTemplate('data-export', {
        APP_NAME: APP_BRAND_NAME,
        FULL_NAME: fullName,
        EXPORT_DATE: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });
      await this.emailProvider.sendMail({
        to: email,
        subject: `${APP_BRAND_NAME} – Your Data Export`,
        html: htmlToSend,
        attachments: [
          {
            filename,
            content: jsonPayload,
            contentType: 'application/json',
          },
        ],
      });
    } catch (error) {
      console.error('Error sending data export email:', error);
      throw new BadGatewayException('Failed to send data export email');
    }
  }
}

export default SendMail;
