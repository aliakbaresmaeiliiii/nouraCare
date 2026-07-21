import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { SocialTokenService } from './services/social-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { jwtConfig } from './config/jwt.config';
import { PrismaModule } from '../prisma/prisma.module';
import { OnboardingModule } from '../onboarding/onboarding.module';
import { UserModule } from '../users/user.module';
import { GrowthModule } from '../growth/growth.module';
import { ReproductiveModule } from '../reproductive/reproductive.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register(jwtConfig),
    PrismaModule,
    OnboardingModule,
    UserModule,
    GrowthModule,
    ReproductiveModule,
    SmsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    RefreshTokenService,
    SocialTokenService,
    JwtStrategy,
    RefreshTokenStrategy,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
