import handlebars from 'handlebars';
import path from 'path';
import fs from 'fs/promises';
import { BadGatewayException, UnauthorizedException } from '@nestjs/common';
import { EmailProvider } from 'src/auth/config/email';

const { APP_NAME } = process.env;

class SendMail {
  private emailProvider: EmailProvider;

  constructor(emailProvider: EmailProvider) {
    this.emailProvider = emailProvider;
  }
  private async loadTemplate(
    templateName: string,
    data: object,
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

  public async sendAccountRegister(email: string, verifyCode: string) {
    try {
      const htmlToSend = await this.loadTemplate('emailverify', {
        APP_NAME,
        TOKEN: verifyCode,
      });
      await this.emailProvider.send(email, 'Ali  Registration', htmlToSend);
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
        APP_NAME: APP_NAME || 'NouraCare',
        FULL_NAME: fullName,
        EXPORT_DATE: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      });
      await this.emailProvider.sendMail({
        to: email,
        subject: `${APP_NAME || 'NouraCare'} – Your Data Export`,
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
