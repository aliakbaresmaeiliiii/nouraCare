export interface ApiResponse<T = any> {
  isSuccess: boolean;
  message?: string;
  messageKey?: string;
  data?: T;
  code?: number;
  timestamp?: Date;
}

export interface ApiErrorResponse {
  isSuccess: false;
  message: string;
  messageKey?: string;
  code: number;
  timestamp?: Date;
  errors?: any[];
}
