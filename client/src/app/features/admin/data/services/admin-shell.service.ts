import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminShellService {
  readonly sidebarCollapsed = signal(false);
  readonly mobileNavOpen = signal(false);
  readonly searchOpen = signal(false);
  readonly notificationsOpen = signal(false);
  readonly quickActionsOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  openMobileNav(): void {
    this.mobileNavOpen.set(true);
  }

  closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  toggleMobileNav(): void {
    this.mobileNavOpen.update((v) => !v);
  }
}
