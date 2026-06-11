import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { GetCycleDashboardUseCase } from '../application/get-cycle-dashboard.usecase';

/**
 * Menstrual tracking API — thin controller layer (no business logic).
 * Existing clients should continue using GET /me/dashboard; these routes are additive.
 */
@Controller('me/menstrual')
@UseGuards(JwtAuthGuard)
export class MenstrualController {
  constructor(private readonly getCycleDashboard: GetCycleDashboardUseCase) {}

  @Get('dashboard')
  async getDashboard(@Req() req: Request) {
    const user = req.user as { id: number };
    return this.getCycleDashboard.execute(user.id);
  }

  @Get('daily-insight')
  async getDailyInsightOnly(@Req() req: Request) {
    const user = req.user as { id: number };
    const dashboard = await this.getCycleDashboard.execute(user.id);
    return {
      insight: dashboard.insight,
      phase: dashboard.phaseGuide.phase,
      cycleDay: dashboard.cycleDay,
    };
  }
}
