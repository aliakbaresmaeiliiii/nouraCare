import { Injectable, ApplicationRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

/** Set to `true` to re-enable multi-language UI and switching. */
export const LANGUAGE_SWITCHING_ENABLED = false;

export const DEFAULT_APP_LANGUAGE = 'fa';

const ALL_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ms', name: 'Bahasa Malaysia', flag: '🇲🇾' },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷' },
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
    if (!LANGUAGE_SWITCHING_ENABLED) {
      this.persistLanguage(DEFAULT_APP_LANGUAGE);
      this.applyLanguage(DEFAULT_APP_LANGUAGE);
      return;
    }

    const savedLanguage =
      localStorage.getItem('selectedLanguage') || DEFAULT_APP_LANGUAGE;
    this.setLanguage(savedLanguage);
  }

  getLanguages(): Language[] {
    return this.languages;
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  setLanguage(languageCode: string): void {
    if (!LANGUAGE_SWITCHING_ENABLED) {
      this.applyLanguage(DEFAULT_APP_LANGUAGE);
      return;
    }

    if (this.languages.some((lang) => lang.code === languageCode)) {
      this.persistLanguage(languageCode);
      this.applyLanguage(languageCode);

      setTimeout(() => {
        this.appRef.tick();
      }, 0);
    }
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
