import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; phone: string }) {
    if (!body.email || !body.phone) {
      throw new BadRequestException('Email and phone are required!');
    }
    return this.authService.register(body.email, body.phone);
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
}
