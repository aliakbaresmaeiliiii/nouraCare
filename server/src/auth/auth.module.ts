import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { jwtConfig } from './config/jwt.config';
import { PrismaModule } from '../prisma/prisma.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { UserModule } from '../users/user.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register(jwtConfig),
    PrismaModule,
    OnboardingModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokenService,
    JwtStrategy,
    RefreshTokenStrategy,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
