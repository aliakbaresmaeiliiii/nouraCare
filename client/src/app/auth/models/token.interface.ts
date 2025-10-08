export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expires_in?: number;
  token_type?: string;
  isVerified?: boolean;
}

export interface JwtPayload {
  sub: string;
  email: string;
  exp: number;
  iat: number;
  isVerified?: boolean;
  [key: string]: any;
}
