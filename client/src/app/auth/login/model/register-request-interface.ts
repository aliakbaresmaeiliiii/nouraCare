import { OnboardingDataDto } from '../../../shared/services/onboarding.service';

// Register request payload
export interface RegisterRequest {
  email: string | null | undefined;
  phoneNumber: string | null | undefined;
  onboardingData?: OnboardingDataDto;
}
