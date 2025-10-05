import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/services/prisma.service';

@Injectable()
export class RefreshTokenService {
  constructor(private prisma: PrismaService) {}

  async createRefreshToken(userId: number, token: string, expiresInDays: number = 14): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Hash the refresh token before storing
    const hashedToken = await bcrypt.hash(token, 12);

    await this.prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async validateRefreshToken(token: string, userId: number): Promise<boolean> {
    const refreshTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    for (const refreshToken of refreshTokens) {
      const isValid = await bcrypt.compare(token, refreshToken.token);
      if (isValid) {
        return true;
      }
    }

    return false;
  }

  async revokeRefreshToken(token: string, userId: number): Promise<void> {
    const refreshTokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
      },
    });

    for (const refreshToken of refreshTokens) {
      const isValid = await bcrypt.compare(token, refreshToken.token);
      if (isValid) {
        await this.prisma.refreshToken.update({
          where: { id: refreshToken.id },
          data: { isRevoked: true },
        });
        return;
      }
    }
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });
  }
}
