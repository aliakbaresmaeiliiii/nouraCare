import { AppDataSource } from "../config/database";
import { env } from "../config/env";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUniqueCodev3 } from "../helper/common";
import SendMail from "../helper/send_email";
import { EmailProvider } from "../config/email";
import { prisma } from "../config/prisma";

export class AuthService {
  private jwtSecret = env.JWT_SECRET;

  async register(email: string, phone: string) {
    const existing = await prisma.user.findUnique({
      where: { email },
    });
    if(existing)throw new Error("User already exists with this email");

    const verificationCode = getUniqueCodev3();

    await prisma.user.create({
      data: {
        email,
        phone,
        verificationCode,
      },
    });

    const emailService = new SendMail(new EmailProvider());
    await emailService.sendAccountRegister(email, verificationCode);
    return { email, phone, verificationCode };
  }

  async verifyEmail(email: string, code: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");

    if (user.verificationCode !== code) {
      throw new Error("Invalid verification code");
    }

    user.isVerified = true;
    // user.verificationCode = null;
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationCode: null },
    });
    return user;
  }

  async login(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("User not found");

    // const valid = await bcrypt.compare(password, user.passwrod);
    // if (!valid) throw new Error("Invalid password");

    const isVerified = user.isVerified;
    if (!isVerified) {
      throw new Error("User email is not verified");
    }

    const token = jwt.sign({ id: user.id }, this.jwtSecret, {
      expiresIn: "1d",
    });
    return { token, user };
  }
}
