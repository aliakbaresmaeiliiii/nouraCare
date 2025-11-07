import { Body, Controller, Post, Get, Param, Logger } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingDataDto } from './dto/onboarding.dto';

@Controller('onboarding')
export class OnboardingController {
  private readonly logger = new Logger(OnboardingController.name);

  constructor(private onboardingService: OnboardingService) {}

  @Post('save')
  async saveOnboardingData(@Body() onboardingData: OnboardingDataDto) {
    this.logger.log('Received onboarding data request');
    this.logger.debug('Onboarding data payload:', JSON.stringify(onboardingData, null, 2));
    
    try {
      const startTime = Date.now();
      const result = await this.onboardingService.saveTemporaryOnboardingData(onboardingData);
      const endTime = Date.now();
      
      this.logger.log(`Onboarding data saved successfully in ${endTime - startTime}ms`);
      this.logger.debug(`Session ID: ${result.sessionId}`);
      
      return result;
    } catch (error) {
      this.logger.error('Failed to save onboarding data:', error.message);
      this.logger.error('Error stack:', error.stack);
      throw error;
    }
  }

  @Get(':sessionId')
  async getOnboardingData(@Param('sessionId') sessionId: string) {
    this.logger.log(`Retrieving onboarding data for session: ${sessionId}`);
    
    try {
      const data = await this.onboardingService.getTemporaryOnboardingData(sessionId);
      this.logger.log(`Onboarding data retrieved successfully for session: ${sessionId}`);
      
      return {
        sessionId,
        data,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to retrieve onboarding data for session ${sessionId}:`, error.message);
      throw error;
    }
  }

  @Post(':sessionId/complete')
  async completeOnboarding(
    @Param('sessionId') sessionId: string,
    @Body() body: { email: string; phone: string },
  ) {
    this.logger.log(`Completing onboarding for session: ${sessionId}`);
    this.logger.debug(`Registration data: ${JSON.stringify(body, null, 2)}`);
    
    try {
      const result = await this.onboardingService.completeOnboardingWithRegistration(
        sessionId,
        body.email,
        body.phone,
      );
      
      this.logger.log(`Onboarding completed successfully for session: ${sessionId}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to complete onboarding for session ${sessionId}:`, error.message);
      this.logger.error('Error stack:', error.stack);
      throw error;
    }
  }
}
