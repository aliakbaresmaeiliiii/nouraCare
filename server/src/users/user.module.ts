import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { ProfileController } from './profile.controller';
import { UserService } from './user.service';
import { OnboardingService } from './onboarding.service';
import { DataExportService } from './data-export.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthEngagementModule } from '../health-engagement/health-engagement.module';
import { MenstrualModule } from '../reproductive/menstrual/menstrual.module';

@Module({
  imports: [PrismaModule, HealthEngagementModule, MenstrualModule],
  controllers: [UserController, ProfileController],
  providers: [UserService, OnboardingService, DataExportService],
  exports: [UserService, OnboardingService, DataExportService],
})
export class UserModule {}
