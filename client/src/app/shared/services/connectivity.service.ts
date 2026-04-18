import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Remembers where the user was when the app navigates to the offline screen,
 * so we can return there after the connection is restored.
 */
@Injectable({ providedIn: 'root' })
export class ConnectivityService {
  private readonly router = inject(Router);

  private pendingReturnUrl: string | null = null;
  private returnNavigationDone = false;

  setPendingReturnUrl(url: string): void {
    if (!url || url.startsWith('/offline')) {
      return;
    }
    this.pendingReturnUrl = url;
  }

  /** Call when the offline screen is shown so a new "return once" cycle can run. */
  resetReturnNavigationLock(): void {
    this.returnNavigationDone = false;
  }

  consumePendingReturnUrl(): string | null {
    const next = this.pendingReturnUrl;
    this.pendingReturnUrl = null;
    return next;
  }

  peekPendingReturnUrl(): string | null {
    return this.pendingReturnUrl;
  }

  /** Safe when both the browser `online` event and the offline page "Try again" run close together. */
  navigateAwayFromOfflineIfNeeded(): void {
    if (this.returnNavigationDone) {
      return;
    }
    const path = this.router.url.split('?')[0];
    if (path !== '/offline') {
      return;
    }
    this.returnNavigationDone = true;
    const next = this.consumePendingReturnUrl() ?? '/tabs/home';
    void this.router.navigateByUrl(next);
  }
}
