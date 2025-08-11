import { AppDataSource } from "../config/database";
import { env } from "../config/env";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../entities/user.entity";
import { getUniqueCodev3 } from "../helper/common";
import SendMail from "../helper/send_email";
import { EmailProvider } from "../config/email";

export class AuthService {
  private userRepo = AppDataSource.getRepository(User);
  private jwtSecret = env.JWT_SECRET;

  async register(email: string, phone: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new Error("Email already registered");

    const verificationCode = getUniqueCodev3();

    const user = this.userRepo.create({ email, phone, verificationCode });
    await this.userRepo.save(user);
    const emailService = new SendMail(new EmailProvider());
    await emailService.sendAccountRegister(email, verificationCode);
    return user;
  }

  // async verifyEmail(email: string, code: string) {
  //   const user = await this.userRepo.findOne({ where: { email } });
  //   if (!user) throw new Error("User not found");

  //   if (user.verificationCode !== code) {
  //     throw new Error("Invalid verification code");
  //   }

  //   user.isVerified = true;
  //   // user.verificationCode = null;
  //   await this.userRepo.save(user);
  //   return user;
  // }

  // async login(email: string, password: string) {
  //   const user = await this.userRepo.findOne({ where: { email } });
  //   if (!user) throw new Error("User not found");

  //   const valid = await bcrypt.compare(password, user.passwrod);
  //   if (!valid) throw new Error("Invalid password");

  //   const token = jwt.sign({ id: user.id }, this.jwtSecret, {
  //     expiresIn: "1d",
  //   });
  //   return { token, user };
  // }
}
