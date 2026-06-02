/** Stable i18n keys returned to the client (translated in the app). */
export const AUTH_MESSAGE_KEYS = {
  OTP_SENT_IF_EXISTS: 'auth.api.otpSentIfExists',
  EMAIL_VERIFIED: 'auth.api.emailVerified',
  VERIFICATION_CODE_SENT: 'auth.api.verificationCodeSent',
  USER_NOT_FOUND: 'auth.api.userNotFound',
  EMAIL_ALREADY_VERIFIED: 'auth.api.emailAlreadyVerified',
  INVALID_VERIFICATION_CODE: 'auth.api.invalidVerificationCode',
  VERIFICATION_CODE_EXPIRED: 'auth.api.verificationCodeExpired',
  FAILED_SEND_VERIFICATION_EMAIL: 'auth.api.failedSendVerificationEmail',
  ACCOUNT_NOT_ACTIVE: 'auth.api.accountNotActive',
  EMAIL_NOT_VERIFIED: 'auth.api.emailNotVerified',
  FAILED_SEND_SIGNIN_CODE: 'auth.api.failedSendSignInCode',
  INVALID_OR_EXPIRED_SIGNIN_CODE: 'auth.api.invalidOrExpiredSignInCode',
  USER_ALREADY_EXISTS: 'auth.api.userAlreadyExists',
} as const;

export type AuthMessageKey =
  (typeof AUTH_MESSAGE_KEYS)[keyof typeof AUTH_MESSAGE_KEYS];
