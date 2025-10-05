import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { OnboardingDataDto } from 'src/onboarding/dto/onboarding.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    if (!registerDto.email || !registerDto.phone) {
      throw new BadRequestException('Email and phone are required!');
    }
    return this.authService.register(registerDto, registerDto.onboardingData);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; verify_code: string }) {
    if (!body.email || !body.verify_code) {
      throw new BadRequestException('Email and verification code are required');
    }
    return this.authService.verifyEmail(body.email, body.verify_code);
  }

  @Post('resend-otp')
  async resendOtp(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }
    return this.authService.resendOtp(body.email);
  }

  @Post('sign-in')
  async signIn(@Body() body: { email: string }) {
    if (!body.email) {
      throw new BadRequestException('Email is required');
    }

    return this.authService.login(body.email);
  }

  @Post('refresh')
  @UseGuards(AuthGuard('refresh'))
  async refreshTokens(@Req() req: any) {
    const { refreshToken } = req.user;
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: any, @Body() body: { refreshToken: string }) {
    if (!body.refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }
    return this.authService.logout(body.refreshToken, req.user.id);
  }

  @Post('logout-all')
  @UseGuards(AuthGuard('jwt'))
  async logoutAll(@Req() req: any) {
    return this.authService.logoutAll(req.user.id);
  }
}
