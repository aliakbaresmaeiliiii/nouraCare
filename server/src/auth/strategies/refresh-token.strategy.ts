import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { RefreshTokenService } from '../refresh-token.service';
import { PrismaService } from '../../prisma/services/prisma.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(
    private refreshTokenService: RefreshTokenService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    // Decode the refresh token to get user ID (without verification)
    const decoded = this.decodeToken(refreshToken);
    if (!decoded || !decoded.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = decoded.sub;

    // Validate the refresh token against the database
    const isValid = await this.refreshTokenService.validateRefreshToken(refreshToken, userId);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Get user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        profileImage: true,
        isVerified: true,
        status: true,
        city: true,
        birthday: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('User email is not verified');
    }

    return { ...user, refreshToken };
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
}
