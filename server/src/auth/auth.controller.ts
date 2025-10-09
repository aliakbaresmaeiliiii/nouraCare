import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { ApiResponseHelper } from 'src/core/helpers/api-response.helper';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    if (!registerDto.email || !registerDto.phone) {
      throw new BadRequestException('Email and phone are required!');
    }
    const result = await this.authService.register(registerDto, registerDto.onboardingData);
    return ApiResponseHelper.success(result, 'User registered successfully');
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; verify_code: string }) {
    if (!body.email || !body.verify_code) {
      throw new BadRequestException('Email and verification code are required');
    }
    const result = await this.authService.verifyEmail(body.email, body.verify_code);
    return ApiResponseHelper.success(result, 'Email verified successfully');
  }

  @Post('resend-otp')
  async resendOtp(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }
    await this.authService.resendOtp(body.email);
    return ApiResponseHelper.success(null, 'OTP sent successfully');
  }

  @Post('sign-in')
  async signIn(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }

    const result = await this.authService.login(body.email);
    return ApiResponseHelper.success(result, 'Login successful');
  }

  @Post('refresh')
  @UseGuards(AuthGuard('refresh'))
  async refreshTokens(@Req() req: any) {
    const { refreshToken } = req.user;
    const result = await this.authService.refreshTokens(refreshToken);
    return ApiResponseHelper.success(result, 'Tokens refreshed successfully');
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: any, @Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    await this.authService.logout(body.refreshToken, req.user.id);
    return ApiResponseHelper.success(null, 'Logged out successfully');
  }

  @Post('logout-all')
  @UseGuards(AuthGuard('jwt'))
  async logoutAll(@Req() req: any) {
    await this.authService.logoutAll(req.user.id);
    return ApiResponseHelper.success(null, 'Logged out from all devices successfully');
  }

  @Get('verify-user-exists')
  @UseGuards(AuthGuard('jwt'))
  async verifyUserExists(@Req() req: any) {
    const result = await this.authService.verifyUserExists(req.user.id);
    return ApiResponseHelper.success(result, 'User verified successfully');
  }
}
