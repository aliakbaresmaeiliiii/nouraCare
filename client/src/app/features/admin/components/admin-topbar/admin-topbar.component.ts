import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { LanguageService } from '@app/shared/services/language.service';
import { TranslationService } from '@app/shared/services/translation.service';
import { ADMIN_BREADCRUMB_KEYS } from '../../data/nav.config';
import { AdminNotificationsService } from '../../data/services/admin-notifications.service';
import { AdminSessionService } from '../../data/services/admin-session.service';
import { AdminShellService } from '../../data/services/admin-shell.service';
import { AdminThemeService } from '../../data/services/admin-theme.service';
import { AdminToastService } from '../../data/services/admin-toast.service';

@Component({
  selector: 'app-admin-topbar',
  standalone: true,
  imports: [RouterLink, DatePipe, TranslatePipe],
  templateUrl: './admin-topbar.component.html',
  styleUrl: './admin-topbar.component.scss',
})
export class AdminTopbarComponent {
  private readonly router = inject(Router);
  readonly shell = inject(AdminShellService);
  private readonly themeSvc = inject(AdminThemeService);
  private readonly toast = inject(AdminToastService);
  private readonly notifications = inject(AdminNotificationsService);
  private readonly session = inject(AdminSessionService);
  private readonly language = inject(LanguageService);
  private readonly i18n = inject(TranslationService);

  readonly theme = this.themeSvc.theme;
  readonly unreadCount = this.notifications.unreadCount;
  readonly notificationsOpen = this.shell.notificationsOpen;
  readonly searchOpen = this.shell.searchOpen;
  readonly quickActionsOpen = this.shell.quickActionsOpen;
  readonly langOpen = signal(false);
  readonly notificationItems = this.notifications.items;
  readonly sessionUser = this.session.me;
  readonly languages = this.language.getMarketingLanguages();
  readonly currentLang = toSignal(this.language.currentLanguage$, {
    initialValue: this.language.getCurrentLanguage(),
  });

  readonly userInitial = computed(() => {
    const name = this.sessionUser()?.fullName?.trim() || 'S';
    return name.charAt(0).toUpperCase();
  });

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly crumbs = computed(() => {
    this.currentLang();
    const parts = (this.url() || '')
      .split('?')[0]
      .split('/')
      .filter(Boolean);
    const adminIdx = parts.indexOf('admin');
    const segments = adminIdx >= 0 ? parts.slice(adminIdx + 1) : parts;
    return segments.map((seg, i) => ({
      label: this.i18n.translate(ADMIN_BREADCRUMB_KEYS[seg] ?? seg),
      path: '/admin/' + segments.slice(0, i + 1).join('/'),
    }));
  });

  readonly pageTitle = computed(() => {
    const list = this.crumbs();
    return list.length ? list[list.length - 1].label : 'Admin';
  });

  toggleTheme(): void {
    this.themeSvc.toggle();
  }

  toggleMobileNav(): void {
    this.shell.toggleMobileNav();
  }

  toggleSearch(): void {
    this.shell.searchOpen.update((v) => !v);
    this.shell.notificationsOpen.set(false);
    this.shell.quickActionsOpen.set(false);
    this.langOpen.set(false);
  }

  toggleNotifications(): void {
    this.shell.notificationsOpen.update((v) => !v);
    this.shell.searchOpen.set(false);
    this.shell.quickActionsOpen.set(false);
    this.langOpen.set(false);
  }

  toggleQuickActions(): void {
    this.shell.quickActionsOpen.update((v) => !v);
    this.shell.searchOpen.set(false);
    this.shell.notificationsOpen.set(false);
    this.langOpen.set(false);
  }

  toggleLang(): void {
    this.langOpen.update((v) => !v);
    this.shell.searchOpen.set(false);
    this.shell.notificationsOpen.set(false);
    this.shell.quickActionsOpen.set(false);
  }

  setLanguage(code: string): void {
    this.language.setPreferredLanguage(code);
    this.langOpen.set(false);
  }

  markAllRead(): void {
    this.notifications.markAllRead();
  }

  onSearch(term: string): void {
    if (!term.trim()) return;
    this.toast.show(
      `${this.i18n.translate('admin.topbar.search')}: “${term.trim()}”`,
      'info',
    );
    this.shell.searchOpen.set(false);
  }
}
