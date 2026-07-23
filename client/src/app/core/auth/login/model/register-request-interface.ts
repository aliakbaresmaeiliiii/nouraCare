import { OnboardingDataDto } from '@app/shared/services/onboarding.service';

// Register request payload
export interface RegisterRequest {
  email: string | null | undefined;
  phoneNumber: string | null | undefined;
  onboardingData?: OnboardingDataDto;
  /** Optional; also read from session when user opened an invite link. */
  inviteCode?: string;
}
