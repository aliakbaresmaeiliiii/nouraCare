import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

export const THEME_STORAGE_KEY = 'themePreference';
/** @deprecated migrated to themePreference */
const LEGACY_DARK_MODE_KEY = 'darkMode';

export type ThemePreference = 'light' | 'dark' | 'system';

export function readStoredPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') {
      return v;
    }
    const legacy = localStorage.getItem(LEGACY_DARK_MODE_KEY);
    let resolved: ThemePreference = 'system';
    if (legacy === 'true') {
      resolved = 'dark';
    } else if (legacy === 'false') {
      resolved = 'light';
    }
    if (legacy !== null) {
      localStorage.setItem(THEME_STORAGE_KEY, resolved);
      localStorage.removeItem(LEGACY_DARK_MODE_KEY);
    }
    return resolved;
  } catch {
    /* storage unavailable */
  }
  return 'system';
}

export function resolveEffectiveDark(preference: ThemePreference): boolean {
  if (preference === 'dark') {
    return true;
  }
  if (preference === 'light') {
    return false;
  }
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function setPaletteDarkClass(el: Element | null | undefined, dark: boolean): void {
  if (!el) {
    return;
  }
  el.classList.toggle('ion-palette-dark', dark);
}

/**
 * Class-based Ionic dark mode (`dark.class.css`): toggle `ion-palette-dark` on `ion-app`
 * (with `.md` / `.ios`) so Ionic’s stepped `--ion-*` tokens apply. Also set on `html` for
 * `:host-context(html.ion-palette-dark)` in feature SCSS. Custom `--brand-*` aliases live in
 * `global.scss` after `dark.class.css` and map to those Ionic variables — no per-control overrides.
 */
export function applyThemeDom(preference: ThemePreference): void {
  if (typeof document === 'undefined') {
    return;
  }
  const dark = resolveEffectiveDark(preference);
  const html = document.documentElement;
  setPaletteDarkClass(html, dark);
  html.setAttribute('data-theme', dark ? 'dark' : 'light');
  html.style.colorScheme = dark ? 'dark' : 'light';
  document.body.classList.toggle('dark', dark);

  const syncIonApp = (): void => {
    setPaletteDarkClass(document.querySelector('ion-app'), dark);
  };
  syncIonApp();
  // main.ts runs before <ion-app> exists — retry so html/ion-app stay in sync.
  if (!document.querySelector('ion-app')) {
    queueMicrotask(syncIonApp);
    requestAnimationFrame(syncIonApp);
  }
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly preference$ = new BehaviorSubject<ThemePreference>(readStoredPreference());
  private readonly appearanceTick$ = new Subject<void>();
  private mediaQuery?: MediaQueryList;
  private readonly boundOnSchemeChange = () => this.applyFromCurrentPreference();

  readonly preferenceChanges$: Observable<ThemePreference> = this.preference$.asObservable();
  /** Emits when the resolved light/dark appearance may have changed (preference or OS scheme). */
  readonly appearanceChanged$: Observable<void> = this.appearanceTick$.asObservable();

  init(): void {
    this.preference$.next(readStoredPreference());
    this.applyFromCurrentPreference();
    this.attachSystemListener();
  }

  /** Re-apply palette classes (e.g. after `ion-app` mounts). Safe to call multiple times. */
  syncDomFromPreference(): void {
    applyThemeDom(this.preference$.value);
  }

  getPreference(): ThemePreference {
    return this.preference$.value;
  }

  setPreference(preference: ThemePreference): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
      if (localStorage.getItem(LEGACY_DARK_MODE_KEY) !== null) {
        localStorage.removeItem(LEGACY_DARK_MODE_KEY);
      }
    } catch {
      /* ignore */
    }
    this.preference$.next(preference);
    this.applyFromCurrentPreference();
    this.attachSystemListener();
  }

  effectiveIsDark(): boolean {
    return resolveEffectiveDark(this.preference$.value);
  }

  labelFor(preference: ThemePreference): string {
    switch (preference) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
      default:
        return 'System';
    }
  }

  subtitleForCurrent(): string {
    const p = this.preference$.value;
    if (p === 'system') {
      const follows = resolveEffectiveDark('system') ? 'Dark' : 'Light';
      return `Match device (${follows} now)`;
    }
    return this.labelFor(p);
  }

  private applyFromCurrentPreference(): void {
    applyThemeDom(this.preference$.value);
    this.appearanceTick$.next();
  }

  private attachSystemListener(): void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }
    if (this.preference$.value !== 'system') {
      this.detachSystemListener();
      return;
    }
    if (this.mediaQuery) {
      return;
    }
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.mediaQuery.addEventListener('change', this.boundOnSchemeChange);
  }

  private detachSystemListener(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.boundOnSchemeChange);
      this.mediaQuery = undefined;
    }
  }
}
