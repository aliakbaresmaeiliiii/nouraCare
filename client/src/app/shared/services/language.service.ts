import { Injectable, ChangeDetectorRef, ApplicationRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<string>('en');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  private readonly languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ms', name: 'Bahasa Malaysia', flag: '🇲🇾' },
    { code: 'fa', name: 'فارسی', flag: '🇮🇷' }
  ];

  constructor(private appRef: ApplicationRef) {
    // Load saved language from localStorage or default to English
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'en';
    this.setLanguage(savedLanguage);
  }

  getLanguages(): Language[] {
    return this.languages;
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  setLanguage(languageCode: string): void {
    if (this.languages.some(lang => lang.code === languageCode)) {
      this.currentLanguageSubject.next(languageCode);
      localStorage.setItem('selectedLanguage', languageCode);
      
      // Update document language attribute
      document.documentElement.lang = languageCode;
      
      // Update document direction for RTL languages if needed
      if (languageCode === 'ar' || languageCode === 'he' || languageCode === 'fa') {
        document.documentElement.dir = 'rtl';
      } else {
        document.documentElement.dir = 'ltr';
      }

      // Trigger change detection to update all components
      setTimeout(() => {
        this.appRef.tick();
      }, 0);
    }
  }

  getLanguageName(code: string): string {
    const language = this.languages.find(lang => lang.code === code);
    return language ? language.name : code;
  }

  getLanguageFlag(code: string): string {
    const language = this.languages.find(lang => lang.code === code);
    return language ? language.flag : '🌐';
  }
}
