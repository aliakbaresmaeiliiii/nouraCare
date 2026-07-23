# JWT Authentication Implementation

This document describes the JWT Access + Refresh token handling implementation for the Angular application.

## Overview

The implementation provides secure JWT token management with automatic token refresh and route protection.

## Key Features

1. **Access Token Storage**: Stored in memory (BehaviorSubject) with sessionStorage backup
2. **Refresh Token Storage**: Stored securely in localStorage
3. **Automatic Token Refresh**: HttpInterceptor handles 401 responses and refreshes tokens
4. **Route Protection**: AuthGuard protects authenticated routes
5. **Authentication State Management**: Signals and BehaviorSubjects track auth state

## Components

### 1. AuthService (`src/app/auth/services/auth.ts`)

Main authentication service with the following methods:

#### Core Methods
- `login(data: LoginRequest): Observable<TokenResponse>` - Login with mobile/OTP
- `refreshToken(): Observable<TokenResponse>` - Refresh access token
- `logout(): void` - Logout user and clear tokens
- `isAuthenticated(): boolean` - Check authentication status
- `getAccessToken(): string | null` - Get current access token

#### Token Management
- `handleTokenResponse(response: TokenResponse)` - Process successful token response
- `isTokenValid(token: string): boolean` - Validate token expiration
- `decodeToken(token: string): JwtPayload` - Decode JWT token
- `clearTokens(): void` - Clear all tokens and reset state

#### User Management
- `setUserInfoFromToken(token: string)` - Extract user info from token
- `currentUser` - Computed signal for current user
- `userInfo` - Signal for user information

### 2. JwtInterceptor (`src/app/auth/interceptor/jwt.interceptor.ts`)

HttpInterceptor that:
- Adds Authorization header to requests
- Handles 401 responses by refreshing tokens
- Automatically retries failed requests with new tokens
- Prevents multiple concurrent refresh requests

### 3. AuthGuard (`src/app/auth/guards/auth.guard.ts`)

Route guard that:
- Protects authenticated routes
- Attempts token refresh if access token is expired
- Redirects to login if authentication fails

### 4. Token Interfaces (`src/app/auth/models/token.interface.ts`)

TypeScript interfaces for token management:
- `TokenResponse` - API response structure
- `JwtPayload` - JWT token payload structure

## Usage Examples

### 1. Login Implementation

```typescript
// In your login component
login() {
  const loginData: LoginRequest = {
    mobile: '1234567890',
    otp: '123456'
  };

  this.authService.login(loginData).subscribe({
    next: (response) => {
      console.log('Login successful');
      this.router.navigate(['/tabs/home']);
    },
    error: (error) => {
      console.error('Login failed:', error);
    }
  });
}
```

### 2. Protecting Routes

```typescript
// In app.routes.ts
{
  path: 'protected-route',
  loadComponent: () => import('./protected.component'),
  canActivate: [authGuard]
}
```

### 3. Using Authentication State

```typescript
// In any component
export class MyComponent implements OnInit {
  authService = inject(AuthService);
  
  ngOnInit() {
    // Subscribe to authentication state
    this.authService.isAuthenticated$.subscribe(isAuthenticated => {
      if (isAuthenticated) {
        // User is authenticated
      } else {
        // User is not authenticated
      }
    });
    
    // Access current user
    const currentUser = this.authService.currentUser();
  }
}
```

### 4. Manual Token Refresh

```typescript
// Force token refresh
this.authService.refreshToken().subscribe({
  next: () => console.log('Token refreshed'),
  error: () => console.log('Token refresh failed')
});
```

## Storage Strategy

### Access Token
- **Primary**: In-memory (BehaviorSubject)
- **Backup**: sessionStorage (for page reload persistence)
- **Security**: Not persisted to disk, cleared on browser close

### Refresh Token
- **Storage**: localStorage
- **Security**: Persisted across browser sessions
- **Lifetime**: Longer expiration, used to obtain new access tokens

## Error Handling

### Token Refresh Failures
- When refresh token is invalid/expired
- Automatically redirects to login page
- Clears all stored tokens

### Network Errors
- HttpInterceptor handles network issues
- Failed requests are not automatically retried (except for 401)

## Security Considerations

1. **Access Token**: Short-lived, stored in memory
2. **Refresh Token**: Long-lived, stored securely
3. **Token Validation**: Automatic expiration checks
4. **Secure Storage**: localStorage for refresh tokens (consider HttpOnly cookies for production)

## Backend API Requirements

The backend should provide the following endpoints:

### `/auth/sign-in`
```json
POST /auth/sign-in
{
  "mobile": "1234567890",
  "otp": "123456"
}

Response:
{
  "accessToken": "jwt_access_token",
  "refresh_token": "jwt_refresh_token",
  "expires_in": 3600
}
```

### `/auth/refresh`
```json
POST /auth/refresh
{
  "refresh_token": "jwt_refresh_token"
}

Response:
{
  "accessToken": "new_jwt_access_token",
  "refresh_token": "new_jwt_refresh_token",
  "expires_in": 3600
}
```

### `/auth/logout`
```json
POST /auth/logout
{
  // Optional: Include refresh token for server-side invalidation
}
```

## Testing

The implementation includes comprehensive error handling and can be tested by:

1. **Login Flow**: Successful login and token storage
2. **Token Refresh**: Expired access token scenarios
3. **Route Protection**: Accessing protected routes without authentication
4. **Logout**: Clearing tokens and redirecting to login

## Migration Notes

- Existing `AuthService` methods are preserved for backward compatibility
- New token-based authentication works alongside existing methods
- Gradual migration to new authentication system is supported
