/**
 * Durable auth / account hints in localStorage so Add-to-Home-Screen
 * (standalone PWA) cold starts can resume instead of re-onboarding.
 */

export const HAS_ACCOUNT_KEY = 'dorehealth.hasAccount';

export function markHasRegisteredAccount(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(HAS_ACCOUNT_KEY, '1');
  } catch {
    /* ignore quota / private mode */
  }
}

export function hasRegisteredAccount(): boolean {
  if (typeof localStorage === 'undefined') {
    return false;
  }
  try {
    return localStorage.getItem(HAS_ACCOUNT_KEY) === '1';
  } catch {
    return false;
  }
}

export function readStoredRefreshToken(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem('userInfo');
    if (!raw?.trim()) {
      return null;
    }
    const parsed = JSON.parse(raw) as { refreshToken?: unknown };
    const token = parsed?.refreshToken;
    return typeof token === 'string' && token.trim() ? token : null;
  } catch {
    return null;
  }
}

export function hasStoredAccessToken(): boolean {
  if (typeof localStorage === 'undefined') {
    return false;
  }
  try {
    return !!localStorage.getItem('accessToken')?.trim();
  } catch {
    return false;
  }
}

/** True when we can open the app as a returning session (access and/or refresh). */
export function hasRefreshableSession(): boolean {
  return hasStoredAccessToken() || !!readStoredRefreshToken();
}

export function hasStoredUserInfo(): boolean {
  if (typeof localStorage === 'undefined') {
    return false;
  }
  try {
    const raw = localStorage.getItem('userInfo');
    if (!raw?.trim()) {
      return false;
    }
    const parsed = JSON.parse(raw) as unknown;
    return !!parsed && typeof parsed === 'object';
  } catch {
    return false;
  }
}
