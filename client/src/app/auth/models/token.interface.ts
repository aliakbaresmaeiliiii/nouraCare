export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expires_in?: number;
  token_type?: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  exp: number;
  iat: number;
  [key: string]: any;
}
