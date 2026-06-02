import { Strategy } from 'passport-custom';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { RefreshTokenService } from '../refresh-token.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { parseRefreshToken } from '../services/social-token.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'refresh') {
  constructor(
    private refreshTokenService: RefreshTokenService,
    private prisma: PrismaService,
  ) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const refreshToken = req.body?.refreshToken;

    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new UnauthorizedException('Refresh token is required');
    }

    const parsed = parseRefreshToken(refreshToken);
    if (!parsed) {
      throw new UnauthorizedException('Invalid refresh token format');
    }

    const userId = parsed.userId;

    const isValid = await this.refreshTokenService.validateRefreshToken(
      refreshToken,
      userId,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        fullName: true,
        isVerified: true,
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
}
