import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { GeoModule } from './geo/geo.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { TrackDayModule } from './track-day/track-day.module';
import { DoctorsModule } from './doctors/doctors.module';
import { SecretChatsModule } from './secret-chats/secret-chats.module';
import { ForumModule } from './forum/forum.module';
import { ReproductiveModule } from './reproductive/reproductive.module';
import { HealthEngagementModule } from './health-engagement/health-engagement.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { GrowthModule } from './growth/growth.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserModule,
    GeoModule,
    OnboardingModule,
    TrackDayModule,
    DoctorsModule,
    SecretChatsModule,
    ForumModule,
    ReproductiveModule,
    HealthEngagementModule,
    SubscriptionModule,
    GrowthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
