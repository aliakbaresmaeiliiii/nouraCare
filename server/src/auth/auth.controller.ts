import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { OtpRequestDto } from './dto/otp-request.dto';
import { OtpVerifyDto } from './dto/otp-verify.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { LogoutDto } from './dto/logout.dto';
import { ApiResponseHelper } from 'src/core/helpers/api-response.helper';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { resolveRequestLocale } from './utils/resolve-request-locale.util';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('x-app-language') appLanguage?: string,
  ) {
    if (!registerDto.email) {
      throw new BadRequestException('Email is required!');
    }
    const result = await this.authService.register(
      registerDto,
      resolveRequestLocale(acceptLanguage, appLanguage),
    );
    if ('otpSent' in result && result.otpSent) {
      return ApiResponseHelper.success(
        result,
        result.message,
        200,
        result.messageKey,
      );
    }
    return ApiResponseHelper.success(result, 'User registered successfully');
  }

  /** Unified OTP — step 1: send code (email or sms.ir). */
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('otp/request')
  async requestOtp(
    @Body() dto: OtpRequestDto,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('x-app-language') appLanguage?: string,
  ) {
    if (!dto.email && !dto.phoneNumber) {
      throw new BadRequestException('Email or phone number is required');
    }
    const result = await this.authService.requestOtp(
      { email: dto.email, phoneNumber: dto.phoneNumber },
      resolveRequestLocale(acceptLanguage, appLanguage),
    );
    return ApiResponseHelper.success(
      result,
      result.message,
      200,
      result.messageKey,
    );
  }

  /** Unified OTP — step 2: verify code and issue tokens. */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('otp/verify')
  async verifyOtp(@Body() dto: OtpVerifyDto) {
    if (!dto.email && !dto.phoneNumber) {
      throw new BadRequestException('Email or phone number is required');
    }
    const result = await this.authService.verifyOtp({
      email: dto.email,
      phoneNumber: dto.phoneNumber,
      otp: dto.otp,
    });
    return ApiResponseHelper.success(result, 'Login successful');
  }

  /** @deprecated Prefer /auth/otp/request and /auth/otp/verify */
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('sign-in')
  async signIn(
    @Body() loginDto: LoginDto,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('x-app-language') appLanguage?: string,
  ) {
    if (!loginDto.email && !loginDto.phoneNumber) {
      throw new BadRequestException('Email or phone number is required');
    }
    const result = await this.authService.login(
      {
        email: loginDto.email,
        phoneNumber: loginDto.phoneNumber,
        otp: loginDto.otp,
        onboardingData: loginDto.onboardingData,
        inviteCode: loginDto.inviteCode,
      },
      resolveRequestLocale(acceptLanguage, appLanguage),
    );
    if ('otpSent' in result && result.otpSent) {
      return ApiResponseHelper.success(
        result,
        result.message,
        200,
        result.messageKey,
      );
    }
    return ApiResponseHelper.success(result, 'Login successful');
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('social-login')
  async socialLogin(@Body() socialLoginDto: SocialLoginDto) {
    const result = await this.authService.socialLogin(socialLoginDto);
    return ApiResponseHelper.success(result, 'Social login successful');
  }

  @Public()
  @UseGuards(AuthGuard('refresh'))
  @Post('refresh')
  async refreshTokens(@Req() req: any) {
    const { refreshToken } = req.user;
    const result = await this.authService.refreshTokens(refreshToken);
    return ApiResponseHelper.success(result, 'Tokens refreshed successfully');
  }

  @Post('logout')
  async logout(@Req() req: any, @Body() body: LogoutDto) {
    await this.authService.logout(body.refreshToken, req.user.id);
    return ApiResponseHelper.success(null, 'Logged out successfully');
  }

  @Post('logout-all')
  async logoutAll(@Req() req: any) {
    await this.authService.logoutAll(req.user.id);
    return ApiResponseHelper.success(null, 'Logged out from all devices successfully');
  }

  @Get('verify-user-exists')
  async verifyUserExists(@Req() req: any) {
    const result = await this.authService.verifyUserExists(req.user.id);
    return ApiResponseHelper.success(result, 'User verified successfully');
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(
      verifyEmailDto.email,
      verifyEmailDto.code,
    );
    return ApiResponseHelper.success(
      result,
      'Email verified successfully',
      200,
      result.messageKey,
    );
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('resend-verification')
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
    @Headers('accept-language') acceptLanguage?: string,
    @Headers('x-app-language') appLanguage?: string,
  ) {
    const result = await this.authService.resendVerificationCode(
      resendVerificationDto.email,
      resolveRequestLocale(acceptLanguage, appLanguage),
    );
    return ApiResponseHelper.success(
      result,
      'Verification code sent successfully',
      200,
      result.messageKey,
    );
  }
}
