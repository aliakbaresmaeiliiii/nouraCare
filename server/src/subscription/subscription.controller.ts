import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import type { user_subscription_billing_interval } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionService } from './subscription.service';

class SubscribeBodyDto {
  interval!: user_subscription_billing_interval;
}

@Controller('me')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('subscription')
  async getSubscription(@Req() req: Request) {
    const user = req.user as { id: number };
    return this.subscriptionService.getSummary(user.id);
  }

  @Post('subscription/trial')
  async startTrial(@Req() req: Request) {
    const user = req.user as { id: number };
    return this.subscriptionService.startTrial(user.id);
  }

  @Post('subscription/subscribe')
  async subscribe(
    @Req() req: Request,
    @Body() body: SubscribeBodyDto,
  ) {
    const user = req.user as { id: number };
    const interval = body?.interval;
    if (interval !== 'MONTH' && interval !== 'YEAR') {
      throw new BadRequestException('interval must be MONTH or YEAR');
    }
    return this.subscriptionService.subscribeMock(user.id, interval);
  }
}
