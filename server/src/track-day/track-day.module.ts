import { Module } from '@nestjs/common';
import { TrackDayController } from './track-day.controller';
import { TrackDayService } from './track-day.service';
import { PrismaModule } from '../prisma/prisma.module';
import { HealthEngagementModule } from '../health-engagement/health-engagement.module';

@Module({
  imports: [PrismaModule, HealthEngagementModule],
  controllers: [TrackDayController],
  providers: [TrackDayService],
  exports: [TrackDayService],
})
export class TrackDayModule {}
