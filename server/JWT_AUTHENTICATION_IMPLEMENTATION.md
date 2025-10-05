# JWT Authentication Implementation

This document describes the JWT authentication system implemented in the NestJS application.

## Overview

The application now supports JWT-based authentication with Access Tokens and Refresh Tokens, providing secure and scalable authentication for mobile and web clients.

## Key Features

1. **Access Token (JWT)**: Short-lived token (30 minutes) for API access
2. **Refresh Token (JWT)**: Long-lived token (14 days) stored securely in database
3. **Token Rotation**: Refresh tokens are rotated on each use for enhanced security
4. **Secure Storage**: Refresh tokens are hashed before storing in database
5. **Revocation Support**: Tokens can be individually or globally revoked

## Database Schema Changes

### New Model: RefreshToken

```prisma
model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    Int
  expiresAt DateTime
  createdAt DateTime @default(now())
  isRevoked Boolean  @default(false)
  user      user     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}
```

### Updated Model: User

Added relation to refresh tokens:
```prisma
refreshTokens RefreshToken[]
```

## API Endpoints

### Authentication Flow

1. **POST /api/v1/auth/register** - User registration
2. **POST /api/v1/auth/verify-email** - Email verification with OTP
3. **POST /api/v1/auth/sign-in** - Login (returns accessToken + refreshToken)
4. **POST /api/v1/auth/refresh** - Refresh access token using refresh token
5. **POST /api/v1/auth/logout** - Logout (revoke specific refresh token)
6. **POST /api/v1/auth/logout-all** - Logout from all devices

### Request/Response Examples

#### Login
```http
POST /api/v1/auth/sign-in
Content-Type: application/json

{
  "email": "user@example.com"
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "phone": "+1234567890",
    "name": "John Doe",
    "profileImage": null,
    "isVerified": true,
    "status": "PREGNANT",
    "city": "Kuala Lumpur",
    "birthday": "1990-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    // ... user data
  }
}
```

#### Logout
```http
POST /api/v1/auth/logout
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Security Features

### Token Security
- **Access Tokens**: Short-lived (30 minutes) to minimize exposure
- **Refresh Tokens**: Long-lived (14 days) but securely stored and validated
- **Token Hashing**: Refresh tokens are hashed using bcrypt before storage
- **Token Rotation**: New refresh token issued on each refresh request

### Validation
- JWT signature verification
- Token expiration validation
- User verification status check
- Refresh token database validation

## Implementation Details

### Services

1. **AuthService**: Main authentication logic
2. **RefreshTokenService**: Refresh token management
3. **JwtService**: Token generation and validation

### Strategies

1. **JwtStrategy**: Validates access tokens for protected routes
2. **RefreshTokenStrategy**: Validates refresh tokens for token refresh

### Guards

1. **JwtAuthGuard**: Protects routes requiring authentication
2. **AuthGuard('refresh')**: Protects refresh token endpoint

## Usage in Controllers

### Protecting Routes
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@Req() req) {
  return req.user;
}
```

### Refresh Token Endpoint
```typescript
@Post('refresh')
@UseGuards(AuthGuard('refresh'))
async refreshTokens(@Req() req: any) {
  return this.authService.refreshTokens(req.user.refreshToken);
}
```

## Client Implementation

### Mobile/Web Client Flow

1. **Login**: Store both accessToken and refreshToken securely
2. **API Calls**: Include accessToken in Authorization header
3. **Token Expiry**: When accessToken expires (401), call refresh endpoint
4. **Refresh**: Use refreshToken to get new accessToken and refreshToken
5. **Logout**: Call logout endpoint and clear stored tokens

### Token Storage Recommendations

- **Access Token**: In-memory storage (not persistent)
- **Refresh Token**: Secure storage (Keychain on iOS, Keystore on Android, HttpOnly cookies for web)

## Testing

Use the provided `test-jwt-auth.http` file to test the authentication flow with REST Client extension in VSCode.

## Environment Variables

Ensure these environment variables are set:
```env
JWT_SECRET=your-jwt-secret-key-here
DATABASE_URL=mysql://...
# ... other existing environment variables
```

## Migration

The implementation includes a Prisma migration that adds the refresh_tokens table and updates the user model relation.

## Error Handling

- **401 Unauthorized**: Invalid or expired tokens
- **400 Bad Request**: Missing required fields
- **404 Not Found**: User not found
- **403 Forbidden**: User not verified

This implementation provides a robust, secure authentication system that follows industry best practices for JWT-based authentication.
