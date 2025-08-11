import _ from "lodash";
import nodemailer from "nodemailer";
import mg from "nodemailer-mailgun-transport";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const {
  APP_NAME,
  MAIL_DRIVER,
  MAIL_HOST,
  MAIL_PORT,
  MAIL_USERNAME,
  MAIL_PASSWORD,
  MAIL_AUTH_TYPE,
  MAILGUN_API_KEY,
  MAILGUN_DOMAIN,
  OAUTH_CLIENT_ID,
  OAUTH_CLIENT_SECRET,
  OAUTH_REFRESH_TOKEN,
  OAUTH_REDIRECT_URL,
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
            api_key: MAILGUN_API_KEY!,
            domain: MAILGUN_DOMAIN!,
          },
        })
      );
    }

    return nodemailer.createTransport({
      host: MAIL_HOST,
      port: Number(MAIL_PORT),
      secure: false, // Set `true` for port 465 (SSL)
      auth: {
        user: MAIL_USERNAME,
        pass: MAIL_PASSWORD,
      },
    });
  }

  /**
   * Sends an email
   */
  public async send(to: string | string[], subject: string, template: string) {
    try {
      const recipient = Array.isArray(to) ? to.join(", ") : to;
      const mailOptions: nodemailer.SendMailOptions = {
        from: `${APP_NAME} <${MAIL_USERNAME}>`,
        to: recipient,
        subject,
        html: template,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully:", info.messageId);
      return info;
    } catch (error) {
      console.error("❌ Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }
}
