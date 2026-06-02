// Login request payload
export interface LoginRequest {
  email: string;
  phoneNumber?: string;
  /** One-time sign-in code from email (step 2). */
  otp?: string;
}

