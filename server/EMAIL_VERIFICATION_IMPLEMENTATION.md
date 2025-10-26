# Email Verification Implementation

## Overview
This document describes the email verification system implemented for user registration in the Gahvareh application. The system sends a 4-digit verification code to users' email addresses during registration and provides endpoints to verify the code and resend it if needed.

## Features

### 1. Automatic Email Verification on Registration
- When a user registers, a 4-digit verification code is automatically generated
- The code is sent to the user's email address using the existing email template
- The code expires after 15 minutes for security

### 2. Email Verification Endpoints
- **POST /api/v1/auth/verify-email** - Verify email with 4-digit code
- **POST /api/v1/auth/resend-verification** - Resend verification code

### 3. Database Schema Updates
Added two new fields to the `user` model:
- `emailVerificationCode` (String, nullable) - Stores the 4-digit verification code
- `emailVerificationCodeExpires` (DateTime, nullable) - Stores the expiration time

## Implementation Details

### Registration Flow
1. User registers with email, phone number, and full name
2. System generates a random 4-digit code (1000-9999)
3. Code and expiration time (15 minutes) are stored in the database
4. Verification email is sent automatically
5. User receives tokens and can use the app while unverified

### Email Verification Flow
1. User enters the 4-digit code received via email
2. System validates:
   - Code matches the stored code
   - Code hasn't expired
   - Email isn't already verified
3. If valid, user is marked as verified and verification fields are cleared

### Resend Verification Flow
1. User requests a new verification code
2. System generates a new 4-digit code
3. New code is stored with fresh 15-minute expiration
4. New verification email is sent

## API Endpoints

### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "phoneNumber": "1234567890",
  "fullName": "John Doe"
}
```

### Verify Email
```http
POST /api/v1/auth/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "1234"
}
```

### Resend Verification Code
```http
POST /api/v1/auth/resend-verification
Content-Type: application/json

{
  "email": "user@example.com"
}
```

## Email Template
The system uses the existing `emailverify.html` template located at:
```
public/template/email/emailverify.html
```

The template includes:
- Professional email design
- Clear instructions for the user
- Placeholder for the 4-digit code (`{{TOKEN}}`)
- Branding and contact information

## Security Considerations

1. **Code Expiration**: Verification codes expire after 15 minutes
2. **Code Regeneration**: Each resend request generates a new code
3. **One-time Use**: Codes are cleared after successful verification
4. **Case Insensitive**: Email matching is case-insensitive
5. **No Rate Limiting**: Consider adding rate limiting in production

## Testing
Use the provided `test-email-verification.http` file to test the implementation:

1. Register a new user
2. Check email for verification code
3. Verify email with the code
4. Test resend functionality
5. Verify login works with verified/unverified status

## Dependencies
- **Nodemailer**: For sending emails
- **Handlebars**: For email template rendering
- **Prisma**: For database operations
- **Class-validator**: For request validation

## Environment Variables
Ensure these email-related environment variables are set:
- `MAIL_DRIVER`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAILGUN_API_KEY` (if using Mailgun)
- `MAILGUN_DOMAIN` (if using Mailgun)
- `APP_NAME`

## Future Enhancements
1. Add rate limiting for verification requests
2. Implement email verification status in user responses
3. Add webhook for email delivery status
4. Support for multiple verification methods (SMS, etc.)
5. Add verification status to JWT tokens
