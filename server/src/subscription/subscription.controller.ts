import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionService } from './subscription.service';
import { SubscribeBodyDto } from './dto/subscribe-body.dto';

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
    return this.subscriptionService.subscribeMock(user.id, body.interval);
  }
}
