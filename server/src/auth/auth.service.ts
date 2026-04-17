import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/services/prisma.service';
import { RefreshTokenService } from './refresh-token.service';
import { randomUUID } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import SendMail from '../helper/send_email';
import { EmailProvider } from './config/email';
import { OnboardingService as UserOnboardingService } from '../users/onboarding.service';
import { mapRegisterOnboardingPayload } from './utils/map-register-onboarding.util';
import { GrowthService } from '../growth/growth.service';

@Injectable()
export class AuthService {
  private emailProvider: EmailProvider;
  private sendMail: SendMail;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private userOnboarding: UserOnboardingService,
    private growthService: GrowthService,
  ) {
    this.emailProvider = new EmailProvider();
    this.sendMail = new SendMail(this.emailProvider);
  }

  async register(registerDto: RegisterDto) {
    // Check if user already exists by email only
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate 4-digit verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Create user with verification code
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        phoneNumber: registerDto.phoneNumber || '',
        fullName: registerDto.fullName || '',
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpires: verificationCodeExpires,
        updatedAt: new Date(),
        user_subscription: {
          create: {
            usageDayPaywallThreshold: 3 + Math.floor(Math.random() * 3),
          },
        },
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        fullName: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send verification email
    try {
      await this.sendMail.sendAccountRegister(user.email, verificationCode);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't throw error here, just log it
    }

    const onboardingDto = mapRegisterOnboardingPayload(
      registerDto.onboardingData,
    );
    if (onboardingDto) {
      try {
        await this.userOnboarding.saveOnboardingData(user.id, onboardingDto);
      } catch (err) {
        console.error(
          'Failed to persist onboarding_data at registration:',
          err,
        );
      }
    }

    try {
      await this.growthService.onNewAccount(user.id, registerDto.inviteCode);
    } catch (err) {
      console.error('Growth referral setup failed at registration:', err);
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email,);

    return {
      user,
      ...tokens,
    };
  }

  async verifyEmail(email: string, code: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already verified
    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Check if verification code matches
    if (user.emailVerificationCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }

    // Check if verification code is expired
    if (
      !user.emailVerificationCodeExpires ||
      user.emailVerificationCodeExpires < new Date()
    ) {
      throw new BadRequestException('Verification code has expired');
    }

    // Update user as verified
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerificationCode: null,
        emailVerificationCodeExpires: null,
      },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        fullName: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Email verified successfully',
      user: updatedUser,
    };
  }

  async resendVerificationCode(email: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already verified
    if (user.isVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new 4-digit verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with new verification code
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpires: verificationCodeExpires,
      },
    });

    // Send verification email
    try {
      await this.sendMail.sendAccountRegister(user.email, verificationCode);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new BadRequestException('Failed to send verification email');
    }

    return {
      message: 'Verification code sent successfully',
    };
  }

  async login(email: string) {
    // Find user by email
    const data = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        fullName: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!data) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (data.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    // Generate tokens
    const tokens = await this.generateTokens(data.id, data.email);

    return {
      user: data,
      ...tokens,
    };
  }

  async socialLogin(socialLoginDto: SocialLoginDto) {
    const email = socialLoginDto.email?.trim().toLowerCase();
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    let user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        fullName: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create user if this is first social login.
    if (!user) {
      const displayName =
        socialLoginDto.fullName?.trim() ||
        email.split('@')[0]?.replace(/[._-]/g, ' ') ||
        'User';
      const uniquePhone = `${socialLoginDto.provider}_${randomUUID().replace(/-/g, '').slice(0, 20)}`;

      user = await this.prisma.user.create({
        data: {
          email,
          fullName: displayName,
          phoneNumber: uniquePhone,
          isVerified: true,
          updatedAt: new Date(),
          user_subscription: {
            create: {
              usageDayPaywallThreshold: 3 + Math.floor(Math.random() * 3),
            },
          },
        },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          fullName: true,
          role: true,
          status: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      try {
        await this.growthService.onNewAccount(user.id, socialLoginDto.inviteCode);
      } catch (err) {
        console.error('Growth referral setup failed at social registration:', err);
      }
    } else if (!user.isVerified) {
      // Existing account can be promoted to verified via trusted social auth flow.
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          emailVerificationCode: null,
          emailVerificationCodeExpires: null,
        },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          fullName: true,
          role: true,
          status: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    return {
      user,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    // Verify refresh token
    const isValid = await this.refreshTokenService.validateRefreshToken(
      refreshToken,
      0,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Extract user ID from JWT payload (we need to decode the token)
    let userId: number;
    try {
      const payload = this.jwtService.decode(refreshToken) as any;
      userId = payload?.sub;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (!userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        fullName: true,
        role: true,
        status: true,
        isVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user,
      ...tokens,
    };
  }

  async logout(refreshToken: string, userId: number) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    // Revoke the refresh token
    await this.refreshTokenService.revokeRefreshToken(refreshToken, userId);
  }

  async logoutAll(userId: number) {
    // Revoke all refresh tokens for the user
    await this.refreshTokenService.revokeAllUserTokens(userId);
  }

  async verifyUserExists(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        fullName: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      exists: true,
      user,
    };
  }

  private generateTokens(userId: number, email: string) {
    // `sub` must be a string per JWT RFC; keeps Prisma Int lookups safe after parse
    const payload = { sub: String(userId), email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });

    // Generate a refresh token
    const refreshToken = randomUUID();
    this.refreshTokenService.createRefreshToken(userId, refreshToken);

    return {
      accessToken,
      refreshToken,
    };
  }
}
