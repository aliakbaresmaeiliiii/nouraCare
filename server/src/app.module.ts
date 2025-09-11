import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { GeoModule } from './geo/geo.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { TrackDayModule } from './track-day/track-day.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UserModule,
    GeoModule,
    OnboardingModule,
    TrackDayModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
