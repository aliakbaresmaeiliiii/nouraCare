import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReproductiveModule } from '../reproductive/reproductive.module';
import { EngagementService } from './engagement.service';
import { HabitNotificationService } from './habit-notification.service';
import { HabitNotificationCron } from './habit-notification.cron';
import { HealthEngagementController } from './health-engagement.controller';

@Module({
  imports: [PrismaModule, ReproductiveModule],
  controllers: [HealthEngagementController],
  providers: [EngagementService, HabitNotificationService, HabitNotificationCron],
  exports: [EngagementService, HabitNotificationService],
})
export class HealthEngagementModule {}
