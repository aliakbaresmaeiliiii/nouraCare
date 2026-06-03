/** Must match server `generateOtp()` and email template. */
export const EMAIL_OTP_LENGTH = 6;

/** Must match server `emailVerificationCodeExpires` (15 minutes). */
export const EMAIL_OTP_VALIDITY_MS = 15 * 60 * 1000;

export const EMAIL_OTP_RESEND_COOLDOWN_SEC = 60;

export const EMAIL_VERIFICATION_EXPIRES_KEY = 'email_verification_expires_at';
export const EMAIL_VERIFICATION_JUST_SENT_KEY = 'email_verification_just_sent';

export function markEmailVerificationSent(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(
    EMAIL_VERIFICATION_EXPIRES_KEY,
    String(Date.now() + EMAIL_OTP_VALIDITY_MS),
  );
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(EMAIL_VERIFICATION_JUST_SENT_KEY, '1');
  }
}
