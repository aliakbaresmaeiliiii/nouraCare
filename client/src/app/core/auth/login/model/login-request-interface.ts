// Login request payload — email OR phoneNumber (not both required)
export interface LoginRequest {
  email?: string;
  phoneNumber?: string;
  /** One-time sign-in code from email/SMS (step 2). */
  otp?: string;
  /** Attached when sign-in may auto-register a new account. */
  onboardingData?: unknown;
  inviteCode?: string;
}
