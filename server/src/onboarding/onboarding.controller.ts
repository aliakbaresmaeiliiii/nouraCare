import { Body, Controller, Post, Get, Param } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingDataDto } from './dto/onboarding.dto';

@Controller('onboarding')
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Post('save')
  async saveOnboardingData(@Body() onboardingData: OnboardingDataDto) {
    console.log('Received onboarding data:', onboardingData);
    return this.onboardingService.saveTemporaryOnboardingData(onboardingData);
  }

  @Get(':sessionId')
  async getOnboardingData(@Param('sessionId') sessionId: string) {
    const data = await this.onboardingService.getTemporaryOnboardingData(sessionId);
    return {
      sessionId,
      data,
      createdAt: new Date().toISOString()
    };
  }

  @Post(':sessionId/complete')
  async completeOnboarding(
    @Param('sessionId') sessionId: string,
    @Body() body: { email: string; phone: string },
  ) {
    return this.onboardingService.completeOnboardingWithRegistration(
      sessionId,
      body.email,
      body.phone,
    );
  }
}
