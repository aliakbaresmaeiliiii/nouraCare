export interface TokenResponse {
  code: number;
  data: {
    user: {
      id: number;
      email: string;
      phone?: string;
      isVerified?: boolean;
      [key: string]: any;
    };
    accessToken: string;
    refreshToken: string;
  };
  isSuccess: boolean;
  message: string;
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
