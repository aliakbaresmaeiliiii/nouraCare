import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { HAS_ACCOUNT_KEY } from '@app/core/auth/utils/auth-session.util';

const DISMISS_KEY = 'dorehealth.pwaInstallDismissed';

/** Detects iOS Safari browser (not installed PWA / not native shell). */
@Injectable({ providedIn: 'root' })
export class PwaPlatformService {
  /** True when running as installed iOS/Android PWA or Capacitor native app. */
  isStandalone(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    try {
      if (Capacitor.isNativePlatform()) {
        return true;
      }
    } catch {
      /* ignore */
    }
    const nav = window.navigator as Navigator & { standalone?: boolean };
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      nav.standalone === true
    );
  }

  isIosSafari(): boolean {
    if (typeof navigator === 'undefined') {
      return false;
    }
    const ua = navigator.userAgent || '';
    const isIos =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1);
    const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
    return isIos && isSafari;
  }

  shouldShowIosInstallHint(options?: { requireAuth?: boolean }): boolean {
    if (this.isStandalone() || !this.isIosSafari()) {
      return false;
    }
    // Prefer showing after login so install keeps the same localStorage session.
    if (options?.requireAuth !== false) {
      try {
        const hasAccount = localStorage.getItem(HAS_ACCOUNT_KEY) === '1';
        const hasToken = !!localStorage.getItem('accessToken');
        if (!hasAccount && !hasToken) {
          return false;
        }
      } catch {
        return false;
      }
    }
    try {
      return localStorage.getItem(DISMISS_KEY) !== '1';
    } catch {
      return true;
    }
  }

  dismissIosInstallHint(): void {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  }
}
