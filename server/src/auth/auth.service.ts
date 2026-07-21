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
import { SmsIrService } from '../sms/sms-ir.service';

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
    private smsIr: SmsIrService,
  ) {
    this.emailProvider = new EmailProvider();
    this.sendMail = new SendMail(this.emailProvider);
  }

  /**
   * Unified OTP entry — step 1: find or create pending user, send OTP.
   * Phone → sms.ir; email → mail.
   */
  async requestOtp(
    input: { email?: string; phoneNumber?: string },
    locale?: string,
  ) {
    const channel = this.resolveOtpChannel(input);
    const existing = await this.findUserByChannel(channel);

    let user = existing;
    let isNewUser = false;

    if (!user) {
      user = await this.createPendingUser(channel);
      isNewUser = true;
      try {
        await this.growthService.onNewAccount(user.id);
      } catch (err) {
        console.error('Growth referral setup failed at OTP request:', err);
      }
    } else if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        message: 'Account is not active',
        messageKey: AUTH_MESSAGE_KEYS.ACCOUNT_NOT_ACTIVE,
      });
    }

    const code = this.generateOtp();
    const expires = new Date(Date.now() + 15 * 60 * 1000);
    this.logDevOtp(
      channel.kind === 'phone' ? channel.phone : channel.email,
      code,
      'otp-request',
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationCode: code,
        emailVerificationCodeExpires: expires,
      },
    });

    await this.deliverOtp({
      email: user.email,
      phoneNumber: channel.kind === 'phone' ? channel.phone : user.phoneNumber,
      code,
      locale,
      purpose: user.isVerified ? 'sign-in' : 'verification',
      otpChannel: channel.kind === 'phone' ? 'sms' : 'email',
    });

    return {
      otpSent: true,
      isNewUser,
      message: 'If the account exists, a sign-in code was sent.',
      messageKey: AUTH_MESSAGE_KEYS.OTP_SENT_IF_EXISTS,
    };
  }

  /**
   * Unified OTP entry — step 2: verify code, issue tokens, go to home on client.
   */
  async verifyOtp(
    input: { email?: string; phoneNumber?: string; otp: string },
  ) {
    const channel = this.resolveOtpChannel(input);
    const user = await this.findUserByChannel(channel, true);

    if (!user) {
      throw new UnauthorizedException({
        message: 'Invalid or expired sign-in code',
        messageKey: AUTH_MESSAGE_KEYS.INVALID_OR_EXPIRED_SIGNIN_CODE,
      });
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException({
        message: 'Account is not active',
        messageKey: AUTH_MESSAGE_KEYS.ACCOUNT_NOT_ACTIVE,
      });
    }

    const wasUnverified = !user.isVerified;
    const result = await this.completeOtpSignIn(
      user as {
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
      input.otp.trim(),
      wasUnverified,
    );

    return {
      ...result,
      isNewUser: wasUnverified,
    };
  }

  private resolveOtpChannel(input: {
    email?: string;
    phoneNumber?: string;
  }): { kind: 'email'; email: string } | { kind: 'phone'; phone: string } {
    const phone = this.smsIr.normalizeMobile(input.phoneNumber);
    const email = input.email ? this.normalizeEmail(input.email) : undefined;

    if (phone && !email) {
      if (!this.smsIr.isConfigured()) {
        throw new BadRequestException({
          message: 'SMS sign-in is not configured',
          messageKey: AUTH_MESSAGE_KEYS.FAILED_SEND_OTP_SMS,
        });
      }
      return { kind: 'phone', phone };
    }

    if (email && !phone) {
      return { kind: 'email', email };
    }

    // Prefer explicit single channel: if both sent, phone wins only when email absent
    if (email) {
      return { kind: 'email', email };
    }
    if (phone) {
      return { kind: 'phone', phone };
    }

    throw new BadRequestException({
      message: 'Email or phone number is required',
      messageKey: AUTH_MESSAGE_KEYS.EMAIL_OR_PHONE_REQUIRED,
    });
  }

  private async findUserByChannel(
    channel:
      | { kind: 'email'; email: string }
      | { kind: 'phone'; phone: string },
    withOtpFields = false,
  ) {
    if (withOtpFields) {
      const select = {
        ...USER_PUBLIC_SELECT,
        emailVerificationCode: true,
        emailVerificationCodeExpires: true,
      } as const;
      if (channel.kind === 'email') {
        return this.prisma.user.findUnique({
          where: { email: channel.email },
          select,
        });
      }
      return this.prisma.user.findUnique({
        where: { phoneNumber: channel.phone },
        select,
      });
    }

    if (channel.kind === 'email') {
      return this.prisma.user.findUnique({
        where: { email: channel.email },
        select: USER_PUBLIC_SELECT,
      });
    }

    return this.prisma.user.findUnique({
      where: { phoneNumber: channel.phone },
      select: USER_PUBLIC_SELECT,
    });
  }

  private async createPendingUser(
    channel:
      | { kind: 'email'; email: string }
      | { kind: 'phone'; phone: string },
  ) {
    try {
      return await this.prisma.user.create({
        data: {
          email:
            channel.kind === 'email'
              ? channel.email
              : this.phonePlaceholderEmail(channel.phone),
          phoneNumber:
            channel.kind === 'phone'
              ? channel.phone
              : this.resolvePhoneNumber(undefined),
          fullName: '',
          isVerified: false,
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
        const existing = await this.findUserByChannel(channel);
        if (existing) {
          return existing;
        }
        throw new ConflictException({
          message: 'User with this email or phone number already exists',
          messageKey: AUTH_MESSAGE_KEYS.USER_ALREADY_EXISTS,
        });
      }
      throw error;
    }
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

    // New accounts always verify by email OTP. EMAIL_OTP_ENABLED only gates
    // OTP for already-verified users on continue-with-email sign-in.
    const verificationCode = this.generateOtp();
    this.logDevOtp(email, verificationCode, 'register');
    const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

    let user;
    try {
      user = await this.prisma.user.create({
        data: {
          email,
          phoneNumber: this.resolvePhoneNumber(registerDto.phoneNumber),
          fullName: registerDto.fullName || '',
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
        throw new ConflictException({
          message: 'User with this email or phone number already exists',
          messageKey: AUTH_MESSAGE_KEYS.USER_ALREADY_EXISTS,
        });
      }
      throw error;
    }

    try {
      await this.deliverOtp({
        email: user.email,
        phoneNumber: user.phoneNumber,
        code: verificationCode,
        locale,
        purpose: 'verification',
      });
    } catch (error) {
      console.error('Failed to send verification OTP:', error);
      this.logDevOtp(user.email, verificationCode, 'register-otp-failed');
      if (process.env.EMAIL_STRICT === 'true' || env.SMS_STRICT) {
        await this.prisma.user.delete({ where: { id: user.id } }).catch((deleteError) => {
          console.error('Failed to roll back user after OTP error:', deleteError);
        });
        throw new BadRequestException({
          message: 'Failed to send verification code',
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

    return {
      user,
      otpSent: true,
      isNewUser: true,
      requiresVerification: true,
      message: 'If the account exists, a sign-in code was sent.',
      messageKey: AUTH_MESSAGE_KEYS.OTP_SENT_IF_EXISTS,
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
      await this.deliverOtp({
        email: user.email,
        phoneNumber: user.phoneNumber,
        code: verificationCode,
        locale,
        purpose: 'verification',
      });
    } catch (error) {
      console.error('Failed to send verification OTP:', error);
      throw new BadRequestException({
        message: 'Failed to send verification code',
        messageKey: AUTH_MESSAGE_KEYS.FAILED_SEND_VERIFICATION_EMAIL,
      });
    }

    return {
      message: 'Verification code sent successfully',
      messageKey: AUTH_MESSAGE_KEYS.VERIFICATION_CODE_SENT,
    };
  }

  /**
   * Backward-compatible sign-in wrapper around requestOtp / verifyOtp.
   */
  async login(
    input: {
      email?: string;
      phoneNumber?: string;
      otp?: string;
      onboardingData?: Record<string, unknown>;
      inviteCode?: string;
    },
    locale?: string,
  ) {
    if (input.otp?.trim()) {
      const result = await this.verifyOtp({
        email: input.email,
        phoneNumber: input.phoneNumber,
        otp: input.otp.trim(),
      });
      // Best-effort onboarding for legacy clients that still send it on verify.
      if (input.onboardingData && result.user?.id) {
        const onboardingDto = mapRegisterOnboardingPayload(input.onboardingData);
        if (onboardingDto) {
          try {
            await this.userOnboarding.saveOnboardingData(
              result.user.id,
              onboardingDto,
            );
            await this.initializeReproductiveFromOnboarding(
              result.user.id,
              onboardingDto,
            );
          } catch (err) {
            console.error('Failed to persist onboarding on OTP verify:', err);
          }
        }
      }
      if (input.inviteCode && result.isNewUser && result.user?.id) {
        try {
          await this.growthService.onNewAccount(
            result.user.id,
            input.inviteCode,
          );
        } catch (err) {
          console.error('Growth referral on OTP verify failed:', err);
        }
      }
      return result;
    }

    return this.requestOtp(
      { email: input.email, phoneNumber: input.phoneNumber },
      locale,
    );
  }

  /**
   * Deliver OTP. For phone login (otpChannel=sms) always uses sms.ir and never email.
   * For email channel, always uses email.
   */
  private async deliverOtp(params: {
    email: string;
    phoneNumber?: string | null;
    code: string;
    locale?: string;
    purpose: 'sign-in' | 'verification';
    otpChannel?: 'sms' | 'email' | 'auto';
  }): Promise<void> {
    const mobile = this.smsIr.normalizeMobile(params.phoneNumber);
    const phoneOnlyAccount = this.isPhonePlaceholderEmail(params.email);
    const forceSms =
      params.otpChannel === 'sms' || phoneOnlyAccount;

    if (forceSms) {
      if (!this.smsIr.isConfigured() || !mobile) {
        throw new BadRequestException({
          message: 'Failed to send OTP SMS',
          messageKey: AUTH_MESSAGE_KEYS.FAILED_SEND_OTP_SMS,
        });
      }
      await this.smsIr.sendOtp(mobile, params.code);
      return;
    }

    if (params.otpChannel === 'email') {
      await this.sendMail.sendAccountRegister(params.email, params.code, {
        locale: params.locale,
        purpose: params.purpose,
      });
      return;
    }

    let smsSent = false;

    if (this.smsIr.isConfigured() && mobile) {
      try {
        await this.smsIr.sendOtp(mobile, params.code);
        smsSent = true;
      } catch (error) {
        console.error('sms.ir OTP send failed:', error);
        if (env.SMS_STRICT) {
          throw new BadRequestException({
            message: 'Failed to send OTP SMS',
            messageKey: AUTH_MESSAGE_KEYS.FAILED_SEND_OTP_SMS,
          });
        }
      }
    }

    if (smsSent && env.SMS_OTP_SKIP_EMAIL) {
      return;
    }

    try {
      await this.sendMail.sendAccountRegister(params.email, params.code, {
        locale: params.locale,
        purpose: params.purpose,
      });
    } catch (error) {
      if (smsSent) {
        console.error('OTP email failed after SMS success:', error);
        return;
      }
      throw error;
    }
  }

  /** Synthetic email used when the user signs up with phone only. */
  private phonePlaceholderEmail(phone: string): string {
    return `phone.${phone}@phone.local`;
  }

  private isPhonePlaceholderEmail(email: string): boolean {
    return email.endsWith('@phone.local');
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

  /** Empty / invalid phone must still be unique — DB has @unique on phoneNumber. */
  private resolvePhoneNumber(phoneNumber?: string): string {
    const normalized = this.smsIr.normalizeMobile(phoneNumber);
    if (normalized) {
      return normalized;
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
