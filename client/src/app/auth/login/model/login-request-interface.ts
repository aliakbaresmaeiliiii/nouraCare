// Login request payload
export interface LoginRequest {
  email: string;
  phoneNumber?: string;
  /** One-time sign-in code from email (step 2). */
  otp?: string;
  /** Attached when sign-in may auto-register a new email. */
  onboardingData?: unknown;
  inviteCode?: string;
}

