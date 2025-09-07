import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingDataDto } from './dto/onboarding.dto';

@Controller('api/v1/onboarding')
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Post('save')
  async saveOnboardingData(@Body() onboardingData: OnboardingDataDto) {
    return this.onboardingService.saveTemporaryOnboardingData(onboardingData);
  }

  @Get(':sessionId')
  async getOnboardingData(@Param('sessionId') sessionId: string) {
    return this.onboardingService.getTemporaryOnboardingData(sessionId);
  }

  @Post(':sessionId/complete')
  async completeOnboarding(
    @Param('sessionId') sessionId: string,
    @Body() body: { email: string; phone: string }
  ) {
    return this.onboardingService.completeOnboardingWithRegistration(sessionId, body.email, body.phone);
  }
}
