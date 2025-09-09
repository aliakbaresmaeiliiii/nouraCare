import { OnboardingDataDto } from '../../../shared/services/onboarding.service';

// Register request payload
export interface RegisterRequest {
  email: string | null | undefined;
  phone: string | null | undefined;
  onboardingData?: OnboardingDataDto;
}
