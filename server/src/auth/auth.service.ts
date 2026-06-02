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
import { SocialTokenService } from './services/social-token.service';
import { randomUUID } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import SendMail from '../helper/send_email';
import { EmailProvider } from './config/email';
import { OnboardingService as UserOnboardingService } from '../users/onboarding.service';
import { mapRegisterOnboardingPayload } from './utils/map-register-onboarding.util';
import { GrowthService } from '../growth/growth.service';
import { ACCESS_TOKEN_TTL } from './config/jwt.config';
import { parseRefreshToken } from './services/social-token.service';
import { AUTH_MESSAGE_KEYS } from './constants/auth-message-keys';

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  phoneNumber: true,
  fullName: true,
  role: true,
  status: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AuthService {
  private emailProvider: EmailProvider;
  private sendMail: SendMail;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private socialTokenService: SocialTokenService,
    private userOnboarding: UserOnboardingService,
    private growthService: GrowthService,
  ) {
    this.emailProvider = new EmailProvider();
    this.sendMail = new SendMail(this.emailProvider);
  }

  async register(registerDto: RegisterDto, locale?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException({
        message: 'User with this email already exists',
        messageKey: AUTH_MESSAGE_KEYS.USER_ALREADY_EXISTS,
      });
    }

    const verificationCode = this.generateOtp();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

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
      select: USER_PUBLIC_SELECT,
    });

    try {
      await this.sendMail.sendAccountRegister(user.email, verificationCode, {
        locale,
        purpose: 'verification',
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
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

    return {
      user,
      requiresVerification: true,
    };
  }

  async verifyEmail(email: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        messageKey: AUTH_MESSAGE_KEYS.USER_NOT_FOUND,
      });
    }

    if (user.isVerified) {
      throw new BadRequestException({
        message: 'Email is already verified',
        messageKey: AUTH_MESSAGE_KEYS.EMAIL_ALREADY_VERIFIED,
      });
    }

    if (user.emailVerificationCode !== code) {
      throw new BadRequestException({
        message: 'Invalid verification code',
        messageKey: AUTH_MESSAGE_KEYS.INVALID_VERIFICATION_CODE,
      });
    }

    if (
      !user.emailVerificationCodeExpires ||
      user.emailVerificationCodeExpires < new Date()
    ) {
      throw new BadRequestException({
        message: 'Verification code has expired',
        messageKey: AUTH_MESSAGE_KEYS.VERIFICATION_CODE_EXPIRED,
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerificationCode: null,
        emailVerificationCodeExpires: null,
      },
      select: USER_PUBLIC_SELECT,
    });

    const tokens = await this.generateTokens(updatedUser.id, updatedUser.email);

    return {
      message: 'Email verified successfully',
      messageKey: AUTH_MESSAGE_KEYS.EMAIL_VERIFIED,
      user: updatedUser,
      ...tokens,
    };
  }

  async resendVerificationCode(email: string, locale?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        messageKey: AUTH_MESSAGE_KEYS.USER_NOT_FOUND,
      });
    }

    if (user.isVerified) {
      throw new BadRequestException({
        message: 'Email is already verified',
        messageKey: AUTH_MESSAGE_KEYS.EMAIL_ALREADY_VERIFIED,
      });
    }

    const verificationCode = this.generateOtp();
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: verificationCode,
        emailVerificationCodeExpires: verificationCodeExpires,
      },
    });

    try {
      await this.sendMail.sendAccountRegister(user.email, verificationCode, {
        locale,
        purpose: 'verification',
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new BadRequestException({
        message: 'Failed to send verification email',
        messageKey: AUTH_MESSAGE_KEYS.FAILED_SEND_VERIFICATION_EMAIL,
      });
    }

    return {
      message: 'Verification code sent successfully',
      messageKey: AUTH_MESSAGE_KEYS.VERIFICATION_CODE_SENT,
    };
  }

  async login(email: string, otp?: string, locale?: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        ...USER_PUBLIC_SELECT,
        emailVerificationCode: true,
        emailVerificationCodeExpires: true,
      },
    });

    if (!user) {
      return {
        otpSent: true,
        message: 'If the account exists, a sign-in code was sent.',
        messageKey: AUTH_MESSAGE_KEYS.OTP_SENT_IF_EXISTS,
      };
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        message: 'Account is not active',
        messageKey: AUTH_MESSAGE_KEYS.ACCOUNT_NOT_ACTIVE,
      });
    }

    if (!user.isVerified) {
      throw new UnauthorizedException({
        message: 'Email is not verified. Please complete email verification first.',
        messageKey: AUTH_MESSAGE_KEYS.EMAIL_NOT_VERIFIED,
      });
    }

    if (!otp?.trim()) {
      const loginCode = this.generateOtp();
      const loginCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationCode: loginCode,
          emailVerificationCodeExpires: loginCodeExpires,
        },
      });

      try {
        await this.sendMail.sendAccountRegister(user.email, loginCode, {
          locale,
          purpose: 'sign-in',
        });
      } catch (error) {
        console.error('Failed to send sign-in code:', error);
        throw new BadRequestException({
          message: 'Failed to send sign-in code',
          messageKey: AUTH_MESSAGE_KEYS.FAILED_SEND_SIGNIN_CODE,
        });
      }

      return {
        otpSent: true,
        message: 'If the account exists, a sign-in code was sent.',
        messageKey: AUTH_MESSAGE_KEYS.OTP_SENT_IF_EXISTS,
      };
    }

    if (
      user.emailVerificationCode !== otp.trim() ||
      !user.emailVerificationCodeExpires ||
      user.emailVerificationCodeExpires < new Date()
    ) {
      throw new UnauthorizedException({
        message: 'Invalid or expired sign-in code',
        messageKey: AUTH_MESSAGE_KEYS.INVALID_OR_EXPIRED_SIGNIN_CODE,
      });
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: null,
        emailVerificationCodeExpires: null,
      },
    });

    const { emailVerificationCode: _c, emailVerificationCodeExpires: _e, ...publicUser } =
      user;
    const tokens = await this.generateTokens(publicUser.id, publicUser.email);

    return {
      user: publicUser,
      ...tokens,
    };
  }

  async socialLogin(socialLoginDto: SocialLoginDto) {
    let verifiedProfile: { email: string; fullName?: string };

    if (socialLoginDto.provider === 'google') {
      verifiedProfile = await this.socialTokenService.verifyGoogleToken({
        idToken: socialLoginDto.idToken,
        accessToken: socialLoginDto.accessToken,
      });
    } else {
      verifiedProfile = await this.socialTokenService.verifyAppleToken({
        idToken: socialLoginDto.idToken,
        email: socialLoginDto.email,
        fullName: socialLoginDto.fullName,
      });
    }

    const email = verifiedProfile.email;
    const fullName =
      socialLoginDto.fullName?.trim() || verifiedProfile.fullName;

    let user = await this.prisma.user.findUnique({
      where: { email },
      select: USER_PUBLIC_SELECT,
    });

    if (!user) {
      const displayName =
        fullName?.trim() ||
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
        select: USER_PUBLIC_SELECT,
      });

      try {
        await this.growthService.onNewAccount(
          user.id,
          socialLoginDto.inviteCode,
        );
      } catch (err) {
        console.error('Growth referral setup failed at social registration:', err);
      }
    } else if (!user.isVerified) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          emailVerificationCode: null,
          emailVerificationCodeExpires: null,
        },
        select: USER_PUBLIC_SELECT,
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    return { user, ...tokens };
  }

  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const parsed = parseRefreshToken(refreshToken);
    if (!parsed) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isValid = await this.refreshTokenService.validateRefreshToken(
      refreshToken,
      parsed.userId,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: parsed.userId },
      select: USER_PUBLIC_SELECT,
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('User email is not verified');
    }

    await this.refreshTokenService.revokeRefreshToken(
      refreshToken,
      parsed.userId,
    );

    const tokens = await this.generateTokens(user.id, user.email);

    return { user, ...tokens };
  }

  async logout(refreshToken: string, userId: number) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    await this.refreshTokenService.revokeRefreshToken(refreshToken, userId);
  }

  async logoutAll(userId: number) {
    await this.refreshTokenService.revokeAllUserTokens(userId);
  }

  async verifyUserExists(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: USER_PUBLIC_SELECT,
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { exists: true, user };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async generateTokens(userId: number, email: string) {
    const payload = { sub: String(userId), email };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: ACCESS_TOKEN_TTL,
    });

    const refreshToken =
      await this.refreshTokenService.createRefreshToken(userId);

    return { accessToken, refreshToken };
  }
}
