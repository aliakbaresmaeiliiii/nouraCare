import { Controller, Get, Param } from '@nestjs/common';
import { ApiResponseHelper } from '../core/helpers/api-response.helper';
import { GrowthService } from './growth.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('growth')
export class GrowthPublicController {
  constructor(private readonly growth: GrowthService) {}

  @Public()
  @Get('referral/:code/preview')
  async preview(@Param('code') code: string) {
    const data = await this.growth.previewReferralCode(code);
    return ApiResponseHelper.success(data);
  }
}
