import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../prisma/services/prisma.service';

@Injectable()
export class RefreshTokenService {
  constructor(private prisma: PrismaService) {}

  async createRefreshToken(userId: number, token: string, expiresInDays: number = 14): Promise<string> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Hash the refresh token before storing
    const hashedToken = await bcrypt.hash(token, 12);

    // Generate UUID for the refresh token ID
    const refreshTokenId = uuidv4();

    await this.prisma.refresh_tokens.create({
      data: {
        id: refreshTokenId,
        token: hashedToken,
        userId: userId,
        expiresAt: expiresAt,
        createdAt: new Date(),
      },
    });

    return token;
  }

  async validateRefreshToken(token: string, userId: number): Promise<boolean> {
    const refreshTokens = await this.prisma.refresh_tokens.findMany({
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
    const refreshTokens = await this.prisma.refresh_tokens.findMany({
      where: {
        userId,
        isRevoked: false,
      },
    });

    for (const refreshToken of refreshTokens) {
      const isValid = await bcrypt.compare(token, refreshToken.token);
      if (isValid) {
        await this.prisma.refresh_tokens.update({
          where: { id: refreshToken.id },
          data: { isRevoked: true },
        });
        return;
      }
    }
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.prisma.refresh_tokens.updateMany({
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
    await this.prisma.refresh_tokens.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isRevoked: true },
        ],
      },
    });
  }
}
