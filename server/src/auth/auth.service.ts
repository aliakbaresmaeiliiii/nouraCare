import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import SendMail from 'src/helper/send_email';
import { getUniqueCodev3 } from '../helper/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { EmailProvider } from './config/email';
import { env } from './config/env';

@Injectable()
export class AuthService {
  private jwtSecret = env.JWT_SECRET;
  constructor(private prisma: PrismaService) {}

  async register(email: string, phone: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('User already exists with this email');
    }

    const verificationCode = getUniqueCodev3();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMilliseconds() + 3);

    await this.prisma.user.create({
      data: {
        email,
        phone,
        verificationCode,
        verificationCodeExpiresAt: expiry,
        isVerified: false,
      },
    });

    const emailService = new SendMail(new EmailProvider());
    await emailService.sendAccountRegister(email, verificationCode);

    return { email, message: 'User registered successfully' };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('User already verified');
    }

    if (user.verificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    if (user.verificationCodeExpiresAt < new Date()) {
      throw new BadRequestException('Verification code expired');
    }

    await this.prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('User is already verified');
    }

    const verificationCode = getUniqueCodev3();

    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 3);

    await this.prisma.user.update({
      where: { email },
      data: { verificationCode, verificationCodeExpiresAt: expiry },
    });
    const emailService = new SendMail(new EmailProvider());
    await emailService.sendAccountRegister(email, verificationCode);
  }

  async login(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.isVerified)
      throw new UnauthorizedException('User email is not verified');

    const token = jwt.sign({ id: user.id }, this.jwtSecret, {
      expiresIn: '1d',
    });
    return { token, user };
  }
}
