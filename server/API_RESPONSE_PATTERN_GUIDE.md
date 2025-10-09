# API Response Pattern Guide

## Overview

This document describes the consistent API response pattern implemented across all endpoints in the Gahvareh server. The pattern ensures that all API responses follow a standardized format with an `isSuccess` field that can be easily checked on the frontend.

## Response Structure

### Success Response

```typescript
{
  "isSuccess": true,
  "message": "Operation completed successfully",
  "data": { ... }, // Optional: response data
  "code": 200,     // HTTP status code
  "timestamp": "2025-01-09T08:24:05.123Z"
}
```

### Error Response

```typescript
{
  "isSuccess": false,
  "message": "Error description",
  "code": 400,     // HTTP status code
  "timestamp": "2025-01-09T08:24:05.123Z",
  "errors": []     // Optional: detailed error information
}
```

## Frontend Usage

### Checking Success

On the frontend, you can now consistently check for success using:

```javascript
if (res.isSuccess) {
  // Handle success
  const data = res.data;
} else {
  // Handle error
  console.error(res.message);
}
```

### Example Usage

```javascript
// Example API call
const response = await fetch('/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'user@example.com' })
});

const result = await response.json();

if (result.isSuccess) {
  // Success - proceed with the data
  const userData = result.data;
  console.log('Login successful:', result.message);
} else {
  // Error - handle the error
  console.error('Login failed:', result.message);
}
```

## Available Helper Methods

The `ApiResponseHelper` class provides the following static methods:

- `success(data?, message?, code?)` - Generic success response
- `error(message, code, errors?)` - Generic error response
- `created(data?, message?)` - 201 Created response
- `updated(data?, message?)` - 200 Updated response
- `deleted(message?)` - 200 Deleted response
- `notFound(message?)` - 404 Not Found response
- `unauthorized(message?)` - 401 Unauthorized response
- `forbidden(message?)` - 403 Forbidden response
- `badRequest(message?)` - 400 Bad Request response
- `internalError(message?)` - 500 Internal Server Error response

## Implementation Examples

### Controller Implementation

```typescript
@Post('register')
async register(@Body() registerDto: RegisterDto) {
  const result = await this.authService.register(registerDto);
  return ApiResponseHelper.success(result, 'User registered successfully');
}

@Get(':id')
async getUser(@Param('id') id: string) {
  const result = await this.userService.getUserById(+id);
  return ApiResponseHelper.success(result, 'User retrieved successfully');
}
```

### Error Handling

```typescript
@Post('login')
async login(@Body() body: { email: string }) {
  if (!body.email) {
    throw new BadRequestException('Email is required');
  }
  
  try {
    const result = await this.authService.login(body.email);
    return ApiResponseHelper.success(result, 'Login successful');
  } catch (error) {
    // NestJS will handle the exception and return appropriate error response
    throw error;
  }
}
```

## Benefits

1. **Consistency**: All API endpoints follow the same response pattern
2. **Predictability**: Frontend developers know exactly what to expect
3. **Error Handling**: Standardized error responses make error handling easier
4. **Debugging**: Timestamps and structured data help with debugging
5. **Type Safety**: TypeScript interfaces provide type safety

## Migration Status

The following controllers have been updated to use the new response pattern:

- ✅ AuthController
- ✅ UserController
- 🔄 Other controllers will be updated as needed

## Testing

Use the provided `test-api-response.http` file to test the API responses and verify the pattern is working correctly.
