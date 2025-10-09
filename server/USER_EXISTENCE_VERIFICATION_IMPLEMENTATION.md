# User Existence Verification and Automatic Logout Implementation

## Overview

This document describes the server-side implementation for user existence verification and automatic logout when user data is deleted from the database. The solution ensures that users with valid JWT tokens are automatically logged out when their accounts are deleted.

## Implementation Summary

### 1. Enhanced JWT Validation Middleware

**File**: `src/auth/strategies/jwt.strategy.ts`

**Changes**:
- Modified the `validate` method to check if the user still exists in the database
- Returns `401 Unauthorized` with code `USER_DELETED` when user doesn't exist
- Applied to all protected routes automatically through JWT strategy

**Code**:
```typescript
if (!user) {
  throw new UnauthorizedException('User account no longer exists', 'USER_DELETED');
}
```

### 2. User Existence Verification Endpoint

**File**: `src/auth/auth.controller.ts` & `src/auth/auth.service.ts`

**Endpoint**: `GET /api/v1/auth/verify-user-exists`

**Features**:
- Requires valid JWT token in Authorization header
- Returns `200 OK` with user data if user exists
- Returns `404 Not Found` if user doesn't exist
- Used by frontend for periodic existence checks

**Usage**:
```http
GET /api/v1/auth/verify-user-exists
Authorization: Bearer <jwt_token>
```

### 3. User Deletion Webhook

**File**: `src/users/user.service.ts` & `src/users/user.controller.ts`

**Endpoint**: `DELETE /api/v1/user/:id`

**Features**:
- Revokes all refresh tokens for the user before deletion
- Uses database transaction to ensure atomic operations
- Cascade delete handles all related user data
- Automatic token invalidation prevents token reuse

**Implementation**:
```typescript
async deleteUser(userId: number): Promise<void> {
  await this.prismaService.$transaction(async (tx) => {
    // 1. Revoke all refresh tokens
    await tx.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    // 2. Delete user (cascade delete handles related records)
    await tx.user.delete({
      where: { id: userId },
    });
  });
}
```

## Expected Behavior

### Frontend Integration

1. **Periodic Existence Checks**: Frontend should call `/api/v1/auth/verify-user-exists` periodically (e.g., every 5-10 minutes) to verify user still exists.

2. **Automatic Logout**: When frontend receives:
   - `401 Unauthorized` with code `USER_DELETED` from any protected endpoint
   - `404 Not Found` from the verification endpoint
   It should automatically log the user out and redirect to login page.

3. **Token Refresh**: Refresh token operations will also fail if user is deleted, triggering logout.

### API Response Examples

**User Exists**:
```json
{
  "exists": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "phone": "+1234567890",
    "name": "John Doe",
    "profileImage": "http://example.com/image.jpg",
    "isVerified": true,
    "status": "PLANNING_PREGNANCY",
    "city": "Kuala Lumpur",
    "birthday": "1990-01-01T00:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**User Deleted (JWT Validation)**:
```json
{
  "statusCode": 401,
  "message": "User account no longer exists",
  "error": "Unauthorized"
}
```

**User Deleted (Verification Endpoint)**:
```json
{
  "statusCode": 404,
  "message": "User not found",
  "error": "Not Found"
}
```

## Testing

### Test Scenarios

1. **User Deletion While Logged In**:
   - User is logged in with valid JWT token
   - Admin deletes user via DELETE `/api/v1/user/:id`
   - User's subsequent API calls return `401 USER_DELETED`
   - Frontend automatically logs out user

2. **Periodic Verification**:
   - Frontend calls verification endpoint every 5 minutes
   - If user is deleted, frontend receives `404` and logs out

3. **Token Refresh After Deletion**:
   - User tries to refresh token after account deletion
   - Refresh operation fails with appropriate error

### Test File

See `test-user-existence-verification.http` for HTTP request examples.

## Security Considerations

1. **Token Revocation**: All refresh tokens are revoked before user deletion
2. **Atomic Operations**: Database transaction ensures either all operations succeed or none do
3. **Cascade Delete**: Prisma handles deletion of all related user data automatically
4. **No Token Reuse**: Revoked tokens cannot be used for new access tokens

## Integration with Frontend

The frontend should implement:

1. **Error Handling**: Catch `401 USER_DELETED` errors and trigger logout
2. **Periodic Checks**: Call verification endpoint at regular intervals
3. **User Feedback**: Show appropriate messages when user is logged out due to account deletion

## Files Modified

- `src/auth/strategies/jwt.strategy.ts` - Enhanced JWT validation
- `src/auth/auth.controller.ts` - Added verification endpoint
- `src/auth/auth.service.ts` - Added verification logic
- `src/users/user.service.ts` - Added user deletion with token revocation
- `src/users/user.controller.ts` - Added user deletion endpoint

## Dependencies

- Existing JWT authentication system
- Prisma ORM for database operations
- Refresh token service for token management

## Notes

- This implementation works seamlessly with the existing authentication system
- No breaking changes to existing APIs
- Backward compatible with current frontend implementations
- Provides immediate feedback when users are deleted
