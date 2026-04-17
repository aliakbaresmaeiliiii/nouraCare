import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiResponseHelper } from '../core/helpers/api-response.helper';
import { GrowthService } from './growth.service';

@Controller('me/growth')
@UseGuards(JwtAuthGuard)
export class GrowthController {
  constructor(private readonly growth: GrowthService) {}

  @Get('summary')
  async summary(@Req() req: Request) {
    const user = req.user as { id: number };
    const data = await this.growth.getSummary(user.id);
    return ApiResponseHelper.success(data);
  }

  @Post('check-in')
  async checkIn(@Req() req: Request) {
    const user = req.user as { id: number };
    const data = await this.growth.recordCheckIn(user.id);
    return ApiResponseHelper.success(data, 'Check-in recorded');
  }

  @Get('share-summary')
  async shareSummary(@Req() req: Request) {
    const user = req.user as { id: number };
    const data = await this.growth.getSharePayload(user.id);
    return ApiResponseHelper.success(data);
  }
}
