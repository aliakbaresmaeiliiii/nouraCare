import { TranslationService } from '../services/translation.service';

/** Maps legacy English API / Nest error strings to translation keys. */
const SERVER_MESSAGE_TO_KEY: Record<string, string> = {
  'If the account exists, a sign-in code was sent.': 'auth.api.otpSentIfExists',
  'Email verified successfully': 'auth.api.emailVerified',
  'Verification code sent successfully': 'auth.api.verificationCodeSent',
  'User not found': 'auth.api.userNotFound',
  'Email is already verified': 'auth.api.emailAlreadyVerified',
  'Invalid verification code': 'auth.api.invalidVerificationCode',
  'Verification code has expired': 'auth.api.verificationCodeExpired',
  'Failed to send verification email': 'auth.api.failedSendVerificationEmail',
  'Account is not active': 'auth.api.accountNotActive',
  'Email is not verified. Please complete email verification first.':
    'auth.api.emailNotVerified',
  'Failed to send sign-in code': 'auth.api.failedSendSignInCode',
  'Invalid or expired sign-in code': 'auth.api.invalidOrExpiredSignInCode',
  'User with this email already exists': 'auth.api.userAlreadyExists',
  'Email is required!': 'auth.api.emailRequired',
  'Login successful': 'auth.api.loginSuccess',
  'Login failed. Please try again.': 'auth.toast.loginFailed',
};

export interface ApiMessageInput {
  messageKey?: string | null;
  message?: string | null;
  fallbackKey?: string;
}

function normalizeMessage(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

/** Reads message / messageKey from Nest or wrapped HTTP error bodies. */
export function extractApiMessagePayload(error: unknown): ApiMessageInput {
  const root =
    error && typeof error === 'object'
      ? (error as Record<string, unknown>)
      : undefined;
  const body =
    root && root['error'] && typeof root['error'] === 'object'
      ? (root['error'] as Record<string, unknown>)
      : root;

  if (!body) {
    return {};
  }

  const topLevelKey = normalizeMessage(root?.['messageKey']);

  const nested = body['message'];
  if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
    const nestedObj = nested as Record<string, unknown>;
    return {
      messageKey:
        normalizeMessage(nestedObj['messageKey']) ??
        normalizeMessage(body['messageKey']) ??
        topLevelKey,
      message: normalizeMessage(nestedObj['message']),
    };
  }

  return {
    messageKey: normalizeMessage(body['messageKey']) ?? topLevelKey,
    message: normalizeMessage(body['message']),
  };
}

export function resolveApiMessage(
  translation: TranslationService,
  input: ApiMessageInput,
): string {
  const key =
    (input.messageKey && input.messageKey.trim()) ||
    (input.message && SERVER_MESSAGE_TO_KEY[input.message.trim()]);

  if (key) {
    const translated = translation.translate(key);
    if (translated !== key) {
      return translated;
    }
  }

  if (input.fallbackKey) {
    return translation.translate(input.fallbackKey);
  }

  return (input.message && input.message.trim()) || '';
}
