/**
 * Keys written when the user finishes (or saves) the in-app onboarding questionnaire.
 * Unrelated keys (e.g. language) must not decide between welcome vs onboarding.
 */
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
 * Root / welcome entry: use onboarding when there is no saved questionnaire snapshot.
 * Signed-in users who cleared onboarding keys after registration still need the welcome/login shell.
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
