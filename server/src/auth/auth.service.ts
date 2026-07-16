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
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { RegisterDto } from './dto/register.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import SendMail from '../helper/send_email';
import { EmailProvider } from './config/email';
import { OnboardingService as UserOnboardingService } from '../users/onboarding.service';
import { OnboardingDataDto } from '../users/dto/onboarding.dto';
import { mapRegisterOnboardingPayload } from './utils/map-register-onboarding.util';
import { mapOnboardingToReproductiveInit } from './utils/map-onboarding-to-reproductive.util';
import { ReproductiveStateService } from '../reproductive/reproductive-state.service';
import { GrowthService } from '../growth/growth.service';
import { ACCESS_TOKEN_TTL } from './config/jwt.config';
import { parseRefreshToken } from './services/social-token.service';
import { AUTH_MESSAGE_KEYS } from './constants/auth-message-keys';
import { env } from './config/env';

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
    private reproductiveState: ReproductiveStateService,
  ) {
    this.emailProvider = new EmailProvider();
    this.sendMail = new SendMail(this.emailProvider);
  }

  async register(registerDto: RegisterDto, locale?: string) {
    const email = this.normalizeEmail(registerDto.email);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException({
        message: 'User with this email already exists',
        messageKey: AUTH_MESSAGE_KEYS.USER_ALREADY_EXISTS,
      });
    }

    const otpEnabled = env.EMAIL_OTP_ENABLED;
    const verificationCode = otpEnabled ? this.generateOtp() : null;
    if (verificationCode) {
      this.logDevOtp(email, verificationCode, 'register');
    }
    const verificationCodeExpires = otpEnabled
      ? new Date(Date.now() + 15 * 60 * 1000)
      : null;

    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          phoneNumber: this.resolvePhoneNumber(registerDto.phoneNumber),
          fullName: registerDto.fullName || '',
          isVerified: !otpEnabled,
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
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          message: 'User with this email or phone number already exists',
          messageKey: AUTH_MESSAGE_KEYS.USER_ALREADY_EXISTS,
        });
      }
      throw error;
    }

    if (otpEnabled && verificationCode) {
      try {
        await this.sendMail.sendAccountRegister(user.email, verificationCode, {
          locale,
          purpose: 'verification',
        });
      } catch (error) {
        console.error('Failed to send verification email:', error);
        await this.prisma.user.delete({ where: { id: user.id } }).catch((deleteError) => {
          console.error('Failed to roll back user after email error:', deleteError);
        });
        throw new BadRequestException({
          message: 'Failed to send verification email',
          messageKey: AUTH_MESSAGE_KEYS.FAILED_SEND_VERIFICATION_EMAIL,
        });
      }
    }

    const onboardingDto = mapRegisterOnboardingPayload(
      registerDto.onboardingData,
    );
    if (onboardingDto) {
      try {
        await this.userOnboarding.saveOnboardingData(user.id, onboardingDto);
        await this.initializeReproductiveFromOnboarding(user.id, onboardingDto);
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

    if (!otpEnabled) {
      const tokens = await this.generateTokens(user.id, user.email);
      return {
        user,
        requiresVerification: false,
        ...tokens,
      };
    }

    return {
      user,
      requiresVerification: true,
    };
  }

  async verifyEmail(email: string, code: string) {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

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
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });

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
    this.logDevOtp(user.email, verificationCode, 'resend-verification');
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

  /**
   * Continue-with-email:
   * - Existing verified user → login (OTP when EMAIL_OTP_ENABLED)
   * - Unknown email → auto-register, send OTP, return otpSent
   * - Unverified user → send/verify OTP on this same endpoint
   */
  async login(
    email: string,
    otp?: string,
    locale?: string,
    options?: {
      phoneNumber?: string;
      onboardingData?: Record<string, unknown>;
      inviteCode?: string;
    },
  ) {
    const normalizedEmail = this.normalizeEmail(email);
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        ...USER_PUBLIC_SELECT,
        emailVerificationCode: true,
        emailVerificationCodeExpires: true,
      },
    });

    if (!user) {
      if (otp?.trim()) {
        throw new UnauthorizedException({
          message: 'Invalid or expired sign-in code',
          messageKey: AUTH_MESSAGE_KEYS.INVALID_OR_EXPIRED_SIGNIN_CODE,
        });
      }

      // New email: create account and send OTP for verification / first login.
      return this.autoRegisterForEmailSignIn(normalizedEmail, locale, options);
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        message: 'Account is not active',
        messageKey: AUTH_MESSAGE_KEYS.ACCOUNT_NOT_ACTIVE,
      });
    }

    // Unverified accounts always complete via OTP on this endpoint.
    if (!user.isVerified) {
      if (!otp?.trim()) {
        return this.sendSignInOtp(user.id, user.email, locale, 'verification');
      }
      return this.completeOtpSignIn(user, otp.trim(), true);
    }

    // Verified user — OTP optional via feature flag.
    if (!env.EMAIL_OTP_ENABLED) {
      const { emailVerificationCode: _c, emailVerificationCodeExpires: _e, ...publicUser } =
        user;
      const tokens = await this.generateTokens(publicUser.id, publicUser.email);
      return {
        user: publicUser,
        ...tokens,
      };
    }

    if (!otp?.trim()) {
      return this.sendSignInOtp(user.id, user.email, locale, 'sign-in');
    }

    return this.completeOtpSignIn(user, otp.trim(), false);
  }

  /** Create account for an unknown email, email an OTP, and ask the client to verify. */
  private async autoRegisterForEmailSignIn(
    email: string,
    locale?: string,
    options?: {
      phoneNumber?: string;
      onboardingData?: Record<string, unknown>;
      inviteCode?: string;
    },
  ) {
    const verificationCode = this.generateOtp();
    this.logDevOtp(email, verificationCode, 'register');
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          phoneNumber: this.resolvePhoneNumber(options?.phoneNumber),
          fullName: '',
          isVerified: false,
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
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        // Race: another request created this email — continue as existing user.
        const existing = await this.prisma.user.findUnique({
          where: { email },
          select: {
            ...USER_PUBLIC_SELECT,
            emailVerificationCode: true,
            emailVerificationCodeExpires: true,
          },
        });
        if (existing) {
          return this.login(email, undefined, locale, options);
        }
        throw new ConflictException({
          message: 'User with this email or phone number already exists',
          messageKey: AUTH_MESSAGE_KEYS.USER_ALREADY_EXISTS,
        });
      }
      throw error;
    }

    try {
      await this.sendMail.sendAccountRegister(user.email, verificationCode, {
        locale,
        purpose: 'verification',
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Keep account + OTP so the client can still show the OTP step.
      // Set EMAIL_STRICT=true to fail closed (rollback + 400) when mail is required.
      this.logDevOtp(user.email, verificationCode, 'register-email-failed');
      if (process.env.EMAIL_STRICT === 'true') {
        await this.prisma.user.delete({ where: { id: user.id } }).catch((deleteError) => {
          console.error('Failed to roll back user after email error:', deleteError);
        });
        throw new BadRequestException({
          message: 'Failed to send verification email',
          messageKey: AUTH_MESSAGE_KEYS.FAILED_SEND_VERIFICATION_EMAIL,
        });
      }
    }

    const onboardingDto = mapRegisterOnboardingPayload(options?.onboardingData);
    if (onboardingDto) {
      try {
        await this.userOnboarding.saveOnboardingData(user.id, onboardingDto);
        await this.initializeReproductiveFromOnboarding(user.id, onboardingDto);
      } catch (err) {
        console.error(
          'Failed to persist onboarding_data at auto-register sign-in:',
          err,
        );
      }
    }

    try {
      await this.growthService.onNewAccount(user.id, options?.inviteCode);
    } catch (err) {
      console.error('Growth referral setup failed at auto-register sign-in:', err);
    }

    return {
      otpSent: true,
      isNewUser: true,
      requiresVerification: true,
      message: 'If the account exists, a sign-in code was sent.',
      messageKey: AUTH_MESSAGE_KEYS.OTP_SENT_IF_EXISTS,
    };
  }

  private async sendSignInOtp(
    userId: number,
    email: string,
    locale: string | undefined,
    purpose: 'sign-in' | 'verification',
  ) {
    const loginCode = this.generateOtp();
    this.logDevOtp(email, loginCode, purpose === 'verification' ? 'resend-verification' : 'sign-in');
    const loginCodeExpires = new Date(
      Date.now() + (purpose === 'verification' ? 15 : 10) * 60 * 1000,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationCode: loginCode,
        emailVerificationCodeExpires: loginCodeExpires,
      },
    });

    try {
      await this.sendMail.sendAccountRegister(email, loginCode, {
        locale,
        purpose,
      });
    } catch (error) {
      console.error('Failed to send sign-in code:', error);
      this.logDevOtp(
        email,
        loginCode,
        purpose === 'verification'
          ? 'resend-verification-email-failed'
          : 'sign-in-email-failed',
      );
      if (process.env.EMAIL_STRICT === 'true') {
        throw new BadRequestException({
          message:
            purpose === 'verification'
              ? 'Failed to send verification email'
              : 'Failed to send sign-in code',
          messageKey:
            purpose === 'verification'
              ? AUTH_MESSAGE_KEYS.FAILED_SEND_VERIFICATION_EMAIL
              : AUTH_MESSAGE_KEYS.FAILED_SEND_SIGNIN_CODE,
        });
      }
    }

    return {
      otpSent: true,
      message: 'If the account exists, a sign-in code was sent.',
      messageKey: AUTH_MESSAGE_KEYS.OTP_SENT_IF_EXISTS,
    };
  }

  private async completeOtpSignIn(
    user: {
      id: number;
      email: string;
      emailVerificationCode: string | null;
      emailVerificationCodeExpires: Date | null;
      isVerified: boolean;
      phoneNumber?: string | null;
      fullName?: string | null;
      role?: string | null;
      status?: string | null;
      createdAt?: Date;
      updatedAt?: Date;
    },
    otp: string,
    markVerified: boolean,
  ) {
    if (
      user.emailVerificationCode !== otp ||
      !user.emailVerificationCodeExpires ||
      user.emailVerificationCodeExpires < new Date()
    ) {
      throw new UnauthorizedException({
        message: 'Invalid or expired sign-in code',
        messageKey: AUTH_MESSAGE_KEYS.INVALID_OR_EXPIRED_SIGNIN_CODE,
      });
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(markVerified ? { isVerified: true } : {}),
        emailVerificationCode: null,
        emailVerificationCodeExpires: null,
      },
      select: USER_PUBLIC_SELECT,
    });

    const tokens = await this.generateTokens(updatedUser.id, updatedUser.email);

    return {
      user: updatedUser,
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

  /**
   * Align reproductive domain with onboarding answers at signup so Home does not
   * fall back to the default `cycle` dashboard (period ring) for pregnant/postpartum.
   */
  private async initializeReproductiveFromOnboarding(
    userId: number,
    onboardingDto: OnboardingDataDto,
  ): Promise<void> {
    const reproductivePayload = mapOnboardingToReproductiveInit(onboardingDto);
    if (!reproductivePayload) {
      return;
    }
    try {
      await this.reproductiveState.initializeForUser(userId, reproductivePayload);
    } catch (err) {
      console.error(
        'Failed to initialize reproductive_state from onboarding at registration:',
        err,
      );
    }
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /** Empty phone must be unique — DB has @unique on phoneNumber. */
  private resolvePhoneNumber(phoneNumber?: string): string {
    const trimmed = phoneNumber?.trim();
    if (trimmed) {
      return trimmed;
    }
    return `unset_${randomUUID().replace(/-/g, '')}`;
  }

  /** Log OTP when mail fails, or always in non-production. */
  private logDevOtp(email: string, code: string, purpose: string): void {
    const mailFailed = purpose.includes('email-failed');
    if (!mailFailed && env.NODE_ENV === 'production') {
      return;
    }
    console.log(`[auth-otp] ${purpose} → ${email}: ${code}`);
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
