import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HabitNotificationService } from './habit-notification.service';

@Injectable()
export class HabitNotificationCron {
  private readonly logger = new Logger(HabitNotificationCron.name);

  constructor(private readonly habit: HabitNotificationService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async hourlyDigest(): Promise<void> {
    try {
      await this.habit.runScheduledDigests();
    } catch (e) {
      this.logger.error('runScheduledDigests failed', e as Error);
    }
  }
}
