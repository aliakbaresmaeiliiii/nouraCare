import { ApiResponse, ApiErrorResponse } from '../interfaces/api-response.interface';

export class ApiResponseHelper {
  static success<T>(
    data?: T,
    message?: string,
    code: number = 200,
    messageKey?: string,
  ): ApiResponse<T> {
    return {
      isSuccess: true,
      message,
      messageKey,
      data,
      code,
      timestamp: new Date(),
    };
  }

  static error(
    message: string,
    code: number = 400,
    errors?: any[],
    messageKey?: string,
  ): ApiErrorResponse {
    return {
      isSuccess: false,
      message,
      messageKey,
      code,
      timestamp: new Date(),
      errors,
    };
  }

  static created<T>(data?: T, message: string = 'Resource created successfully'): ApiResponse<T> {
    return this.success(data, message, 201);
  }

  static updated<T>(data?: T, message: string = 'Resource updated successfully'): ApiResponse<T> {
    return this.success(data, message, 200);
  }

  static deleted(message: string = 'Resource deleted successfully'): ApiResponse {
    return this.success(undefined, message, 200);
  }

  static notFound(message: string = 'Resource not found'): ApiErrorResponse {
    return this.error(message, 404);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiErrorResponse {
    return this.error(message, 401);
  }

  static forbidden(message: string = 'Forbidden'): ApiErrorResponse {
    return this.error(message, 403);
  }

  static badRequest(message: string = 'Bad request'): ApiErrorResponse {
    return this.error(message, 400);
  }

  static internalError(message: string = 'Internal server error'): ApiErrorResponse {
    return this.error(message, 500);
  }
}
