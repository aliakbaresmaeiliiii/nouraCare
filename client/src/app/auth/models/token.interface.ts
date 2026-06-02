export interface TokenResponse {
  code: number;
  data: {
    user?: {
      id: number;
      email: string;
      phone?: string;
      isVerified?: boolean;
      [key: string]: any;
    };
    accessToken?: string;
    refreshToken?: string;
    /** Step 1 email sign-in: code sent, no tokens yet. */
    otpSent?: boolean;
    messageKey?: string;
    requiresVerification?: boolean;
  };
  isSuccess: boolean;
  message: string;
  messageKey?: string;
  timestamp: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  exp: number;
  iat: number;
  isVerified?: boolean;
  [key: string]: any;
}
