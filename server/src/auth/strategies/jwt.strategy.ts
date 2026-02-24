import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/services/prisma.service';
import { env } from '../config/env';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        fullName: true,
        isVerified: true,
        createdAt: true,
      },
    });
    console.log('👍👍👍👍👍👍',user)
    debugger;

    if (!user) {
      throw new UnauthorizedException('User account no longer exists', 'USER_DELETED');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('User email is not verified');
    }

    return user;
  }
}
