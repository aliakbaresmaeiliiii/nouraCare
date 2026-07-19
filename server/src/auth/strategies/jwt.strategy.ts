import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { user_status } from '@prisma/client';
import { PrismaService } from '../../prisma/services/prisma.service';
import { env } from '../config/env';
import { userIdFromJwtSub } from '../utils/jwt-user-id.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  async validate(payload: { sub?: string }) {
    const id = userIdFromJwtSub(payload.sub);
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        fullName: true,
        role: true,
        status: true,
        isVerified: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User account no longer exists', 'USER_DELETED');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('User email is not verified');
    }

    if (user.status === user_status.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended');
    }

    return user;
  }
}
