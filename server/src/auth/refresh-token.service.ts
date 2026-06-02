import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/services/prisma.service';
import {
  buildRefreshToken,
  parseRefreshToken,
} from './services/social-token.service';

@Injectable()
export class RefreshTokenService {
  constructor(private prisma: PrismaService) {}

  async createRefreshToken(
    userId: number,
    expiresInDays: number = 14,
  ): Promise<string> {
    const secret = randomUUID();
    const opaqueToken = buildRefreshToken(userId, secret);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const hashedToken = await bcrypt.hash(opaqueToken, 12);
    const refreshTokenId = randomUUID();

    await this.prisma.refresh_tokens.create({
      data: {
        id: refreshTokenId,
        token: hashedToken,
        userId,
        expiresAt,
        createdAt: new Date(),
      },
    });

    return opaqueToken;
  }

  async validateRefreshToken(
    token: string,
    userId: number,
  ): Promise<boolean> {
    const parsed = parseRefreshToken(token);
    if (!parsed || parsed.userId !== userId) {
      return false;
    }

    const refreshTokens = await this.prisma.refresh_tokens.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    for (const row of refreshTokens) {
      if (await bcrypt.compare(token, row.token)) {
        return true;
      }
    }
    return false;
  }

  async revokeRefreshToken(token: string, userId: number): Promise<void> {
    const refreshTokens = await this.prisma.refresh_tokens.findMany({
      where: { userId, isRevoked: false },
    });

    for (const row of refreshTokens) {
      if (await bcrypt.compare(token, row.token)) {
        await this.prisma.refresh_tokens.update({
          where: { id: row.id },
          data: { isRevoked: true },
        });
        return;
      }
    }
  }

  async revokeAllUserTokens(userId: number): Promise<void> {
    await this.prisma.refresh_tokens.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });
  }

  async cleanupExpiredTokens(): Promise<void> {
    await this.prisma.refresh_tokens.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: new Date() } }, { isRevoked: true }],
      },
    });
  }
}
