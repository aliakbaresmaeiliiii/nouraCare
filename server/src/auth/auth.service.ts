import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as jwt from 'jsonwebtoken';
import SendMail from 'src/helper/send_email';
import { getUniqueCodev3 } from '../helper/common';
import { PrismaService } from '../prisma/services/prisma.service';
import { RefreshTokenService } from './refresh-token.service';
import { EmailProvider } from './config/email';
import { env } from './config/env';
import { refreshTokenConfig } from './config/jwt.config';
import { RegisterDto } from './dto/register.dto';
import { OnboardingDataDto } from 'src/onboarding/dto/onboarding.dto';

@Injectable()
export class AuthService {
  private jwtSecret = env.JWT_SECRET;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
  ) {}

  async register(
    registerDto: RegisterDto,
    directOnboardingData: OnboardingDataDto,
  ) {
    const { email, phone, sessionId } = registerDto;

    console.log('Registration request:', {
      email,
      phone,
      sessionId,
      directOnboardingData,
    });

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

    // Create user and get the created user
    const user = await this.prisma.user.create({
      data: userData,
    });

    // Save onboarding data to onboarding table if available
    if (onboardingData && Object.keys(onboardingData).length > 0) {
      await this.saveOnboardingDataToUser(user.id, onboardingData);
    }

    // Note: Session-based registration will be handled by the onboarding complete endpoint

    const emailService = new SendMail(new EmailProvider());
    await emailService.sendAccountRegister(email, verificationCode);

    return { 
      email, 
      message: 'User registered successfully', 
      code: 200,
      userId: user.id
    };
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

    // Auto-join main community chat after verification
    await this.autoJoinCommunityChat(updatedUser.id);

    return {
      code: 200,
      message: 'Email verified successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        name: updatedUser.name,
        isVerified: updatedUser.isVerified,
        profileImage: updatedUser.profileImage,
        city: updatedUser.city,
        birthday: updatedUser.birthday,
        createdAt: updatedUser.createdAt,
      },
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

    // Generate access token
    const accessToken = this.generateAccessToken(user.id);
    
    // Generate refresh token
    const refreshToken = this.generateRefreshToken(user.id);
    
    // Store refresh token in database
    await this.refreshTokenService.createRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        city: user.city,
        birthday: user.birthday,
        createdAt: user.createdAt,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    // Validate the refresh token
    const decoded = this.decodeToken(refreshToken);
    if (!decoded || !decoded.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = decoded.sub;
    const isValid = await this.refreshTokenService.validateRefreshToken(refreshToken, userId);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('User email is not verified');
    }

    // Generate new access token
    const newAccessToken = this.generateAccessToken(user.id);

    // Optionally generate new refresh token (token rotation)
    const newRefreshToken = this.generateRefreshToken(user.id);
    await this.refreshTokenService.createRefreshToken(user.id, newRefreshToken);

    // Revoke the old refresh token
    await this.refreshTokenService.revokeRefreshToken(refreshToken, userId);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        city: user.city,
        birthday: user.birthday,
        createdAt: user.createdAt,
      },
    };
  }

  async logout(refreshToken: string, userId: number) {
    await this.refreshTokenService.revokeRefreshToken(refreshToken, userId);
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: number) {
    await this.refreshTokenService.revokeAllUserTokens(userId);
    return { message: 'Logged out from all devices successfully' };
  }

  private generateAccessToken(userId: number): string {
    return this.jwtService.sign(
      { sub: userId },
      { expiresIn: '30m' }, // 30 minutes
    );
  }

  private generateRefreshToken(userId: number): string {
    return this.jwtService.sign(
      { sub: userId },
      { expiresIn: '14d' }, // 14 days
    );
  }

  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }

  private mapPregnancyStatus(status: string): string | undefined {
    const statusMap: { [key: string]: string } = {
      tracking: 'PLANNING_PREGNANCY',
      pregnant: 'PREGNANT',
      postpartum: 'POSTPARTUM',
      trying: 'TRYING_TO_CONCEIVE',
    };
    return statusMap[status] || 'PLANNING_PREGNANCY';
  }

  private mapNotifications(
    notifications: boolean | string,
  ): boolean | undefined {
    if (typeof notifications === 'boolean') return notifications;
    if (typeof notifications === 'string') {
      if (
        notifications.toLowerCase() === 'yes' ||
        notifications.toLowerCase() === 'true'
      )
        return true;
      if (
        notifications.toLowerCase() === 'no' ||
        notifications.toLowerCase() === 'false'
      )
        return false;
    }
    return undefined;
  }

  async verifyUserExists(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        profileImage: true,
        isVerified: true,
        city: true,
        birthday: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      exists: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        profileImage: user.profileImage,
        isVerified: user.isVerified,
        city: user.city,
        birthday: user.birthday,
        createdAt: user.createdAt,
      },
    };
  }

  private async saveOnboardingDataToUser(userId: number, onboardingData: OnboardingDataDto) {
    try {
      // Map the onboarding data to the database schema
      const onboardingDataToSave: any = {
        userId,
        isCompleted: true,
        onboardingStep: 1,
      };

      // Map fields from client format to database format
      if (onboardingData.pregnancy_status) {
        onboardingDataToSave.pregnancyStatus = onboardingData.pregnancy_status.toUpperCase();
      }
      if (onboardingData.last_period) {
        onboardingDataToSave.lastPeriodDate = onboardingData.last_period;
      }
      if (onboardingData.cycle_length) {
        onboardingDataToSave.cycleLength = onboardingData.cycle_length;
      }
      if (onboardingData.period_length) {
        onboardingDataToSave.periodDuration = onboardingData.period_length;
      }
      if (onboardingData.pregnancy_week) {
        onboardingDataToSave.pregnancyWeek = onboardingData.pregnancy_week;
      }
      if (onboardingData.pregnancy_progress) {
        onboardingDataToSave.pregnancyProgress = onboardingData.pregnancy_progress;
      }
      if (onboardingData.health_goals) {
        onboardingDataToSave.healthGoals = onboardingData.health_goals;
      }
      if (onboardingData.notifications !== undefined) {
        onboardingDataToSave.notificationsEnabled = this.mapNotifications(onboardingData.notifications);
      }

      // Save to onboarding_data table
      await this.prisma.onboardingData.create({
        data: onboardingDataToSave,
      });

      console.log(`✅ Onboarding data saved for user ${userId}`);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      // Don't throw error - registration should still succeed
    }
  }

  private async autoJoinCommunityChat(userId: number) {
    try {
      // Find the main community chat
      const communityChat = await this.prisma.secretChat.findFirst({
        where: {
          name: 'Main Community',
          isGroup: true,
        },
      });

      if (communityChat) {
        // Check if user is already a member
        const existingMember = await this.prisma.chatMember.findUnique({
          where: {
            chatId_userId: {
              chatId: communityChat.id,
              userId: userId,
            },
          },
        });

        if (!existingMember) {
          // Add user to community chat
          await this.prisma.chatMember.create({
            data: {
              chatId: communityChat.id,
              userId: userId,
              role: 'MEMBER',
            },
          });
          console.log(`✅ User ${userId} auto-joined Main Community chat`);
        }
      }
    } catch (error) {
      console.error('Error auto-joining community chat:', error);
      // Don't throw error - registration should still succeed
    }
  }
}
