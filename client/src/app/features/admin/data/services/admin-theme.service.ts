import { Injectable, signal, effect } from '@angular/core';
import { AdminTheme } from '../models/admin.models';

const STORAGE_KEY = 'dore.admin.theme';

@Injectable({ providedIn: 'root' })
export class AdminThemeService {
  readonly theme = signal<AdminTheme>(this.readInitial());

  constructor() {
    effect(() => {
      const t = this.theme();
      try {
        localStorage.setItem(STORAGE_KEY, t);
      } catch {
        /* ignore */
      }
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }

  set(theme: AdminTheme): void {
    this.theme.set(theme);
  }

  private readInitial(): AdminTheme {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'dark' || raw === 'light') return raw;
    } catch {
      /* ignore */
    }
    return 'light';
  }
}
