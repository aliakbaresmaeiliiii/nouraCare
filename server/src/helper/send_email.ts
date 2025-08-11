import handlebars from "handlebars";
import path from "path";
import { EmailProvider } from "../config/email";
import fs from "fs/promises";
import { ResponseError } from "../error/response_error";

const { APP_NAME } = process.env;

class SendMail {
  private emailProvider: EmailProvider;

  constructor(emailProvider: EmailProvider) {
    this.emailProvider = emailProvider;
  }
  private async loadTemplate(
    templateName: string,
    data: object
  ): Promise<string> {
    try {
      const templatePath = path.resolve(
        __dirname,
        `../../public/template/email/${templateName}.html`
      );
      const html = await fs.readFile(templatePath, "utf8");
      const template = handlebars.compile(html);
      return template(data);
    } catch (error) {
      console.error(`Error loading email template (${templateName}):`, error);
      throw new ResponseError.NotFound("Email template not found");
    }
  }

  public async sendAccountRegister(email: string, verifyCode: string) {
    try {
      const htmlToSend = await this.loadTemplate("emailverify", { APP_NAME, TOKEN: verifyCode });
      await this.emailProvider.send(email, "Ali  Registration", htmlToSend);
    } catch (error) {
      console.error("Error sending registration email:", error);
      throw new ResponseError.InternalServer("Failed to send email");
    }
  }

  // public static async AccountRegister(formData: any) {
  //   try {
  //     const { email, verify_code: TOKEN } = formData;
  //     const subject = "Ali Doctor Registration";
  //     const templatePath = path.resolve(
  //       __dirname,
  //       "../../public/template/email/emailverify.html"
  //     );

  //     // Read email template using async/await
  //     const html = await fs.readFile(templatePath, "utf8");
  //     const template = handlebars.compile(html);
  //     const htmlToSend = template({ APP_NAME, TOKEN });

  //     // Send email
  //     await this.emailProvider.send(email, subject, htmlToSend);
  //   } catch (error) {
  //     console.error("Error in AccountRegister:", error);
  //     throw new ResponseError.NotFound("Email template not found");
  //   }

  //   // const { email } = formData
  //   // const TOKEN = formData.verify_code
  //   // const pathTemplate = path.resolve(
  //   //   __dirname,
  //   //   `../../public/template/email/emailverify.html`
  //   // )

  //   // const subject = 'Ali Doctor Registration'
  //   // // const urlToken = `${BASE_URL_CLIENT}/email/verify?token=${token}`
  //   // const dataTemplate = { APP_NAME, TOKEN }
  //   // const Email = new EmailProvider()

  //   // readHTMLFile(pathTemplate, (error: Error, html: any) => {
  //   //   if (error) {
  //   //     throw new ResponseError.NotFound('email template not found')
  //   //   }

  //   //   const template = handlebars.compile(html)
  //   //   const htmlToSend = template(dataTemplate)

  //   //   Email.send(email, subject, htmlToSend)
  //   // })
  // }


  // public async sendForgetPassToken(user: User, token: string) {
  //   try {
  //     const htmlToSend = await this.loadTemplate("register", { APP_NAME, TOKEN: token });
  //     await this.emailProvider.send(user.email, "Yours Doctor Registration", htmlToSend);
  //   } catch (error) {
  //     console.error("Error sending password reset email:", error);
  //     throw new ResponseError.InternalServer("Failed to send email");
  //   }
  // }
  // public static forgetPassToken(formData: User, token: string) {
  //   const { email } = formData;
  //   const TOKEN = token;
  //   const pathTemplate = path.resolve(
  //     __dirname,
  //     `../../public/templates/emails/register.html`
  //   );

  //   const subject = "Yours Doctor Registeration";
  //   // const urlToken = `${BASE_URL_CLIENT}/email/verify?token=${token}`
  //   const dataTemplate = { APP_NAME, TOKEN };
  //   const Email = new EmailProvider();

  //   readHTMLFile(pathTemplate, (error: Error, html: any) => {
  //     if (error) {
  //       throw new ResponseError.NotFound("email template not found");
  //     }

  //     const template = handlebars.compile(html);
  //     const htmlToSend = template(dataTemplate);

  //     Email.send(email, subject, htmlToSend);
  //   });
  // }
}

export default SendMail;
