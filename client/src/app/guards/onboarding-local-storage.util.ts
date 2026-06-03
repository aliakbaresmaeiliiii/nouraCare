/**
 * Keys written when the user finishes (or saves) the in-app onboarding questionnaire.
 * Unrelated keys (e.g. language) must not decide between welcome vs onboarding.
 */

/** In-progress questionnaire (step + answers). Not used for routing guards. */
export const ONBOARDING_PROGRESS_KEY = 'onboarding_progress';

export interface OnboardingProgressSnapshot {
  currentStep: number;
  answers: Record<string, unknown>;
  updatedAt: string;
}

export function readOnboardingProgress(): OnboardingProgressSnapshot | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  const raw = localStorage.getItem(ONBOARDING_PROGRESS_KEY);
  if (!raw?.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as OnboardingProgressSnapshot;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.currentStep !== 'number' ||
      !parsed.answers ||
      typeof parsed.answers !== 'object'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeOnboardingProgress(snapshot: OnboardingProgressSnapshot): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(ONBOARDING_PROGRESS_KEY, JSON.stringify(snapshot));
}

export function clearOnboardingProgress(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.removeItem(ONBOARDING_PROGRESS_KEY);
}

export function hasLocalNouraCareOnboardingProfile(): boolean {
  if (typeof localStorage === 'undefined') {
    return false;
  }
  if (localStorage.getItem('onboarding_completed') === 'true') {
    return true;
  }
  const completedRaw = localStorage.getItem('onboarding_completed');
  if (completedRaw) {
    try {
      const parsed = JSON.parse(completedRaw) as unknown;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return true;
      }
    } catch {
      /* ignore */
    }
  }
  const dataRaw = localStorage.getItem('onboarding_data');
  if (!dataRaw?.trim()) {
    return false;
  }
  try {
    const data = JSON.parse(dataRaw) as unknown;
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return false;
    }
    return Object.keys(data as object).length > 0;
  } catch {
    return false;
  }
}

/**
 * Root entry: use onboarding when there is no saved questionnaire snapshot.
 * Signed-in users who cleared onboarding keys after registration still reach sign-in via `/auth/sign-in`.
 */
export function shouldOpenOnboardingFirst(): boolean {
  if (typeof localStorage === 'undefined') {
    return true;
  }
  if (hasLocalNouraCareOnboardingProfile()) {
    return false;
  }
  return !localStorage.getItem('userInfo');
}
