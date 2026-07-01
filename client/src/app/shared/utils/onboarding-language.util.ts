/** Set after the user explicitly picks a language before onboarding. */
export const ONBOARDING_LANGUAGE_CONFIRMED_KEY = 'onboarding_language_confirmed_v1';

export type OnboardingLanguageChoice = 'fa' | 'en';

export function hasConfirmedOnboardingLanguage(): boolean {
  if (typeof localStorage === 'undefined') {
    return false;
  }
  return localStorage.getItem(ONBOARDING_LANGUAGE_CONFIRMED_KEY) === 'true';
}

export function markOnboardingLanguageConfirmed(): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  localStorage.setItem(ONBOARDING_LANGUAGE_CONFIRMED_KEY, 'true');
}
