import { JwtModuleOptions } from '@nestjs/jwt';
import { env } from './env';

export const jwtConfig: JwtModuleOptions = {
  secret: env.JWT_SECRET,
  signOptions: {
    expiresIn: '30m', // Access token expires in 30 minutes
  },
};

export const refreshTokenConfig = {
  expiresIn: '14d', // Refresh token expires in 14 days
};
