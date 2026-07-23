/** Auth routes that must not send Bearer (public sign-in / refresh flows). */
const PUBLIC_AUTH_PATH_SUFFIXES = [
  '/auth/register',
  '/auth/sign-in',
  '/auth/otp/request',
  '/auth/otp/verify',
  '/auth/social-login',
  '/auth/refresh',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/forgot-password',
  '/auth/reset-password',
] as const;

export function isPublicAuthRequest(url: string): boolean {
  const normalized = url.split('?')[0]?.toLowerCase() ?? '';
  return PUBLIC_AUTH_PATH_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}
