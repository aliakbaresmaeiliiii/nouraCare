export interface ApiResponse<T = any> {
  isSuccess: boolean;
  message?: string;
  data?: T;
  code?: number;
  timestamp?: Date;
}

export interface ApiErrorResponse {
  isSuccess: false;
  message: string;
  code: number;
  timestamp?: Date;
  errors?: any[];
}
