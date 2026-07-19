import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { GeoModule } from './geo/geo.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { TrackDayModule } from './track-day/track-day.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { SecretChatsModule } from './secret-chats/secret-chats.module';
import { ForumModule } from './forum/forum.module';
import { ReproductiveModule } from './reproductive/reproductive.module';
import { HealthEngagementModule } from './health-engagement/health-engagement.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { GrowthModule } from './growth/growth.module';
import { AdminModule } from './admin/admin.module';
import { GlobalJwtAuthGuard } from './auth/guards/global-jwt-auth.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 120,
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserModule,
    GeoModule,
    OnboardingModule,
    TrackDayModule,
    DoctorsModule,
    AppointmentsModule,
    SecretChatsModule,
    ForumModule,
    ReproductiveModule,
    HealthEngagementModule,
    SubscriptionModule,
    GrowthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: GlobalJwtAuthGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
