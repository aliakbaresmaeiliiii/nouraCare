import { JwtModuleOptions } from '@nestjs/jwt';
import { env } from './env';

export const ACCESS_TOKEN_TTL = '15m';

export const jwtConfig: JwtModuleOptions = {
  secret: env.JWT_SECRET,
  signOptions: {
    expiresIn: ACCESS_TOKEN_TTL,
  },
};

export const refreshTokenConfig = {
  expiresInDays: 14,
};
