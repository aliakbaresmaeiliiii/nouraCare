import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EngagementService } from './engagement.service';
import { HabitNotificationService } from './habit-notification.service';

@Controller('me/engagement')
@UseGuards(JwtAuthGuard)
export class HealthEngagementController {
  constructor(
    private readonly engagement: EngagementService,
    private readonly habit: HabitNotificationService,
  ) {}

  /** Call on app foreground — records open, refreshes score, may enqueue same-day digest try. */
  @Post('open')
  async recordOpen(@Req() req: Request, @Body() body: { localHour?: number }) {
    const user = req.user as { id: number };
    await this.engagement.recordAppOpen(user.id, body?.localHour);
    const metrics = await this.engagement.refreshEngagementMetrics(user.id);
    const notification = await this.habit.trySendForUserNow(user.id);
    return { metrics, notification };
  }

  @Get('summary')
  async summary(@Req() req: Request) {
    const user = req.user as { id: number };
    return this.engagement.refreshEngagementMetrics(user.id);
  }

  /** Client: user dismissed notification without opening app. */
  @Post('notification-feedback')
  async notificationFeedback(@Req() req: Request, @Body() body: { ignored?: boolean }) {
    const user = req.user as { id: number };
    if (body?.ignored) {
      await this.habit.markNotificationIgnored(user.id);
    }
    return { ok: true };
  }
}
