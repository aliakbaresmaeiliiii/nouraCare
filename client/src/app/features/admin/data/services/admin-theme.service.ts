import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { LanguageService } from '@app/shared/services/language.service';
import { AdminAccent, AdminLayoutMode, AdminTheme } from '../models/admin.models';

const STORAGE_KEY = 'dore.admin.themePrefs';

export interface AdminThemePrefs {
  theme: AdminTheme;
  accent: AdminAccent;
  layout: AdminLayoutMode;
}

const DEFAULTS: AdminThemePrefs = {
  theme: 'light',
  accent: 'violet',
  layout: 'default',
};

@Injectable({ providedIn: 'root' })
export class AdminThemeService {
  private readonly language = inject(LanguageService);

  readonly prefs = signal<AdminThemePrefs>(this.readInitial());
  readonly themePanelOpen = signal(false);

  readonly theme = computed(() => this.prefs().theme);
  readonly accent = computed(() => this.prefs().accent);
  readonly layout = computed(() => this.prefs().layout);

  constructor() {
    effect(() => {
      const p = this.prefs();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
      } catch {
        /* ignore */
      }
    });
  }

  toggle(): void {
    this.prefs.update((p) => ({
      ...p,
      theme: p.theme === 'light' ? 'dark' : 'light',
    }));
  }

  set(theme: AdminTheme): void {
    this.prefs.update((p) => ({ ...p, theme }));
  }

  setAccent(accent: AdminAccent): void {
    this.prefs.update((p) => ({ ...p, accent }));
  }

  setLayout(layout: AdminLayoutMode): void {
    this.prefs.update((p) => ({ ...p, layout }));
  }

  openThemePanel(): void {
    this.themePanelOpen.set(true);
  }

  closeThemePanel(): void {
    this.themePanelOpen.set(false);
  }

  toggleThemePanel(): void {
    this.themePanelOpen.update((v) => !v);
  }

  /** Force document direction for admin preview (RTL / LTR). */
  setDirection(dir: 'rtl' | 'ltr'): void {
    if (dir === 'rtl') {
      this.language.setPreferredLanguage('fa');
    } else {
      this.language.setPreferredLanguage('en');
    }
  }

  private readInitial(): AdminThemePrefs {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AdminThemePrefs>;
        return {
          theme: parsed.theme === 'dark' ? 'dark' : 'light',
          accent: this.normalizeAccent(parsed.accent),
          layout: this.normalizeLayout(parsed.layout),
        };
      }
      // Legacy single-value key
      const legacy = localStorage.getItem('dore.admin.theme');
      if (legacy === 'dark' || legacy === 'light') {
        return { ...DEFAULTS, theme: legacy };
      }
    } catch {
      /* ignore */
    }
    return { ...DEFAULTS };
  }

  private normalizeAccent(v: unknown): AdminAccent {
    const allowed: AdminAccent[] = ['violet', 'orange', 'green', 'slate', 'blue'];
    return allowed.includes(v as AdminAccent) ? (v as AdminAccent) : 'violet';
  }

  private normalizeLayout(v: unknown): AdminLayoutMode {
    const allowed: AdminLayoutMode[] = ['default', 'boxed', 'compact'];
    return allowed.includes(v as AdminLayoutMode) ? (v as AdminLayoutMode) : 'default';
  }
}
