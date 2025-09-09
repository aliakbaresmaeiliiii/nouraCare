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
import { RegisterDto } from './dto/register.dto';
import { OnboardingDataDto } from 'src/onboarding/dto/onboarding.dto';

@Injectable()
export class AuthService {
  private jwtSecret = env.JWT_SECRET;

  constructor(private prisma: PrismaService) {}

  async register(registerDto: RegisterDto,directOnboardingData: OnboardingDataDto) {

    const { email, phone, sessionId } = registerDto;
    
    console.log('Registration request:', { email, phone, sessionId, directOnboardingData });
    
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new BadRequestException('User already exists with this email');
    }

    const verificationCode = getUniqueCodev3();
    const expiry = new Date();
    expiry.setMinutes(expiry.getMilliseconds() + 3);

    // Prepare user data
    const userData: any = {
      email,
      phone,
      verificationCode,
      verificationCodeExpiresAt: expiry,
      isVerified: false,
    };

    // Use direct onboarding data (session-based registration will be handled separately)
    const onboardingData = directOnboardingData;

    // Add onboarding data if available
    if (onboardingData.pregnancy_status) {
      userData.status = this.mapPregnancyStatus(onboardingData.pregnancy_status);
    }
    if (onboardingData.last_period) {
      userData.lastPeriodStartDate = onboardingData.last_period;
    }
    if (onboardingData.cycle_length) {
      userData.menstrualCycleLength = onboardingData.cycle_length;
    }
    if (onboardingData.period_length) {
      userData.periodDuration = onboardingData.period_length;
    }
    if (onboardingData.pregnancy_week) {
      userData.pregnancyWeek = onboardingData.pregnancy_week;
    }
    if (onboardingData.pregnancy_progress) {
      userData.pregnancyProgress = onboardingData.pregnancy_progress;
    }
    if (onboardingData.health_goals) {
      userData.healthGoals = onboardingData.health_goals;
    }
    if (onboardingData.notifications) {
      userData.notificationsEnabled = this.mapNotifications(onboardingData.notifications);
    }

    await this.prisma.user.create({
      data: userData,
    });

    // Note: Session-based registration will be handled by the onboarding complete endpoint

    const emailService = new SendMail(new EmailProvider());
    await emailService.sendAccountRegister(email, verificationCode);

    return { email, message: 'User registered successfully', code: 200 };
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

    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verificationCode: null,
        verificationCodeExpiresAt: null,
      },
    });

    return { 
      message: 'Email verified successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        name: updatedUser.name,
        isVerified: updatedUser.isVerified,
        profileImage: updatedUser.profileImage,
        status: updatedUser.status,
        city: updatedUser.city,
        birthday: updatedUser.birthday,
        createdAt: updatedUser.createdAt
      }
    };
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

  private mapPregnancyStatus(status: string): string | undefined {
    const statusMap: { [key: string]: string } = {
      'tracking': 'PLANNING_PREGNANCY',
      'pregnant': 'PREGNANT',
      'postpartum': 'POSTPARTUM',
      'trying': 'TRYING_TO_CONCEIVE',
    };
    return statusMap[status] || 'PLANNING_PREGNANCY';
  }

  private mapNotifications(notifications: boolean | string): boolean | undefined {
    if (typeof notifications === 'boolean') return notifications;
    if (typeof notifications === 'string') {
      if (notifications.toLowerCase() === 'yes' || notifications.toLowerCase() === 'true') return true;
      if (notifications.toLowerCase() === 'no' || notifications.toLowerCase() === 'false') return false;
    }
    return undefined;
  }
}
