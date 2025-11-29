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
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { ApiResponseHelper } from 'src/core/helpers/api-response.helper';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {

  constructor(private authService:AuthService){}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    if (!registerDto.email) {
      throw new BadRequestException('Email is required!');
    }
    const result = await this.authService.register(registerDto);
    return ApiResponseHelper.success(result, 'User registered successfully');
  }

  @Post('sign-in')
  async signIn(@Body() body: any) {
    // Extract email from the body object
    let email = body.email;
    // If email is not found in the expected location, try to parse it
    if (!email && typeof body === 'object') {
      // Try to find email in the body object
      const bodyString = JSON.stringify(body);
      const emailMatch = bodyString.match(/"email"\s*:\s*"([^"]+)"/);
      if (emailMatch) {
        email = emailMatch[1];
      }
    }
    
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    const result = await this.authService.login(email);
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

  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    const result = await this.authService.verifyEmail(verifyEmailDto.email, verifyEmailDto.code);
    return ApiResponseHelper.success(result, 'Email verified successfully');
  }

  @Post('resend-verification')
  async resendVerification(@Body() resendVerificationDto: ResendVerificationDto) {
    const result = await this.authService.resendVerificationCode(resendVerificationDto.email);
    return ApiResponseHelper.success(result, 'Verification code sent successfully');
  }
}
