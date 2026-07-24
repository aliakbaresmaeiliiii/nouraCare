import { Injectable, ApplicationRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

/** Set to `true` to re-enable multi-language UI and switching in the Ionic app shell. */
export const LANGUAGE_SWITCHING_ENABLED = false;

export const DEFAULT_APP_LANGUAGE = 'fa';

const ALL_LANGUAGES: Language[] = [
  { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ms', name: 'Bahasa Malaysia', flag: '🇲🇾' },
];

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<string>(DEFAULT_APP_LANGUAGE);
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  private readonly languages: Language[] = LANGUAGE_SWITCHING_ENABLED
    ? ALL_LANGUAGES
    : ALL_LANGUAGES.filter((lang) => lang.code === DEFAULT_APP_LANGUAGE);

  constructor(private appRef: ApplicationRef) {
    const savedLanguage =
      localStorage.getItem('selectedLanguage') || DEFAULT_APP_LANGUAGE;
    const initial = ALL_LANGUAGES.some((l) => l.code === savedLanguage)
      ? savedLanguage
      : DEFAULT_APP_LANGUAGE;

    if (!LANGUAGE_SWITCHING_ENABLED) {
      // Honor saved language for marketing; in-app switchers stay hidden.
      this.persistLanguage(initial);
      this.applyLanguage(initial);
      return;
    }

    this.setLanguage(savedLanguage);
  }

  getLanguages(): Language[] {
    return this.languages;
  }

  /** Full language list for landing / marketing (independent of in-app switch flag). */
  getMarketingLanguages(): Language[] {
    return ALL_LANGUAGES;
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  isRtl(): boolean {
    const code = this.getCurrentLanguage();
    return code === 'ar' || code === 'he' || code === 'fa';
  }

  /**
   * In-app language switcher. When `LANGUAGE_SWITCHING_ENABLED` is false,
   * this is a no-op for UI switchers — use {@link setPreferredLanguage} for
   * onboarding / marketing first-run picks that must still apply.
   */
  setLanguage(languageCode: string): void {
    if (!LANGUAGE_SWITCHING_ENABLED) {
      return;
    }

    if (this.languages.some((lang) => lang.code === languageCode)) {
      this.setPreferredLanguage(languageCode);
    }
  }

  /**
   * Persist and apply a supported language even when in-app switchers are hidden.
   * Used by onboarding language gate and marketing / admin surfaces.
   * Defaults remain Persian (`fa`) until the user explicitly chooses.
   */
  setPreferredLanguage(languageCode: string): void {
    if (!ALL_LANGUAGES.some((lang) => lang.code === languageCode)) {
      return;
    }
    this.persistLanguage(languageCode);
    this.applyLanguage(languageCode);
    setTimeout(() => {
      this.appRef.tick();
    }, 0);
  }

  /** @deprecated Prefer {@link setPreferredLanguage}. */
  setMarketingLanguage(languageCode: string): void {
    this.setPreferredLanguage(languageCode);
  }

  getLanguageName(code: string): string {
    const language = ALL_LANGUAGES.find((lang) => lang.code === code);
    return language ? language.name : code;
  }

  getLanguageFlag(code: string): string {
    const language = ALL_LANGUAGES.find((lang) => lang.code === code);
    return language ? language.flag : '🌐';
  }

  private persistLanguage(languageCode: string): void {
    try {
      localStorage.setItem('selectedLanguage', languageCode);
    } catch {
      // Ignore storage errors (private browsing, etc.)
    }
  }

  private applyLanguage(languageCode: string): void {
    this.currentLanguageSubject.next(languageCode);
    document.documentElement.lang = languageCode;

    if (languageCode === 'ar' || languageCode === 'he' || languageCode === 'fa') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }
}
