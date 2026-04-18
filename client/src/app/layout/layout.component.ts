import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  bulb,
  calendar,
  construct,
  home,
  menu,
  notificationsOutline,
  people,
  personCircle,
  school,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { LanguageService } from '../shared/services/language.service';
import { NotificationUnreadService } from '../shared/services/notification-unread.service';
import { TranslationService } from '../shared/services/translation.service';
import { SideMenuComponent } from '../side-menu/side-menu.component';
@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, SideMenuComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LayoutComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly languageService = inject(LanguageService);
  private readonly notificationUnread = inject(NotificationUnreadService);
  private readonly translation = inject(TranslationService);

  selectedTitle = 'Home';
  private languageSubscription!: Subscription;
  private unreadSubscription!: Subscription;
  hasUserAvatar = false;

  unreadCount = 0;
  notificationsAriaLabel = '';

  constructor() {
    addIcons({
      home,
      construct,
      people,
      calendar,
      school,
      bulb,
      menu,
      notificationsOutline,
      personCircle,
    });
  }

  ngOnInit() {
    this.refreshNotificationButtonA11y();

    this.unreadSubscription = this.notificationUnread.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
      this.refreshNotificationButtonA11y();
    });

    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      this.updateTitle(this.router.url);
      this.refreshNotificationButtonA11y();
    });
  }

  ngOnDestroy() {
    this.unreadSubscription?.unsubscribe();
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  get unreadBadgeText(): string {
    return this.unreadCount > 99 ? '99+' : String(this.unreadCount);
  }

  private refreshNotificationButtonA11y(): void {
    if (this.unreadCount <= 0) {
      this.notificationsAriaLabel = this.translation.translate('header.notifications.noUnread');
      return;
    }
    this.notificationsAriaLabel = this.translation
      .translate('header.notifications.withUnread')
      .replace(/\{\{count\}\}/g, String(this.unreadCount));
  }

  private updateTitle(url: string) {
    if (url.includes('/tabs/home')) {
      this.selectedTitle = 'common.home';
    } else if (url.includes('/tabs/insights')) {
      this.selectedTitle = 'nav.insights';
    } else if (url.includes('/tabs/SecretChats')) {
      this.selectedTitle = 'nav.SecretChats';
    } else if (url.includes('/tabs/consultation')) {
      this.selectedTitle = 'nav.consultation';
    } else if (url.includes('/tabs/school')) {
      this.selectedTitle = 'nav.school';
    } else {
      this.selectedTitle = 'common.home';
    }
  }

  // New methods for the modern header
  // getPageIcon(): string {
  //   if (this.selectedTitle.includes('home')) return 'home-outline';
  //   if (this.selectedTitle.includes('insights')) return 'bulb-outline';
  //   if (this.selectedTitle.includes('SecretChats')) return 'people-outline';
  //   if (this.selectedTitle.includes('consultation')) return 'calendar-outline';
  //   if (this.selectedTitle.includes('school')) return 'school-outline';
  //   return 'home-outline';
  // }

  openNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  openProfile(): void {
    this.router.navigate(['/profile']);
  }
}
