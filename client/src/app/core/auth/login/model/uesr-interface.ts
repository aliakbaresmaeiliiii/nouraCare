export interface LoginResponse {
  code: number;
  message: string;
  timestamp: string;
  isSuccess: boolean;
  data: LoginData;
}

export interface LoginData {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface User {
  id?: number;
  email: string;
  phone: string;
  name?: string | null;
  profileImage?: string | null;
  isVerified?: boolean;
  status?: string;
  /** App role from Prisma: USER | ADMIN | SUPER_ADMIN */
  role?: string;
  city?: string | null;
  birthday?: string | null;
  createdAt?: string;
}
export interface RegisterRequest {
  email: string;
  phone: string;
  password: string;
  name?: string;
  profileImage?: string;
}