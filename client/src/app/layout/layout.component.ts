import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
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
import { filter } from 'rxjs/operators';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { LanguageService } from '../shared/services/language.service';
import { NotificationUnreadService } from '../shared/services/notification-unread.service';
import { TranslationService } from '../shared/services/translation.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import { ProfileCompletionService } from '../shared/services/profile-completion.service';
import { UserSessionService } from '../shared/services/user-session.service';
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
  private readonly imageUrlService = inject(ImageUrlService);
  private readonly profileCompletion = inject(ProfileCompletionService);
  private readonly userSession = inject(UserSessionService);

  selectedTitle = 'Home';
  private languageSubscription!: Subscription;
  private unreadSubscription!: Subscription;
  private routerSubscription?: Subscription;
  /** Resolved URL for `<img [src]>` when the user has a real profile photo (not the generic fallback). */
  headerAvatarSrc: string | null = null;
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
    this.loadHeaderProfile();

    this.routerSubscription = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.applyHeaderFromUserStore());

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
    this.routerSubscription?.unsubscribe();
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }

  onHeaderAvatarError(): void {
    this.hasUserAvatar = false;
    this.headerAvatarSrc = null;
  }

  private loadHeaderProfile(): void {
    this.applyHeaderFromUserStore();

    this.profileCompletion.refreshFromAPI().subscribe({
      next: (merged) => {
        if (!merged) {
          return;
        }
        const raw = (merged.profileImageRaw ?? '').toString().trim();
        if (raw) {
          this.hasUserAvatar = true;
          this.headerAvatarSrc = merged.profileImage;
        } else {
          this.hasUserAvatar = false;
          this.headerAvatarSrc = null;
        }
      },
    });
  }

  /** Reads `userInfo.user` from storage (aligned with the side menu). */
  private applyHeaderFromUserStore(): void {
    try {
      const userInfoStore = this.userSession.getUserInfoStoreOrEmpty();
      const user = (userInfoStore.user ?? {}) as Record<string, unknown>;
      const profileImage = user['profileImage'] ?? user['profile_img'];
      const raw =
        typeof profileImage === 'string' ? profileImage.trim() : null;
      if (raw && !raw.startsWith('blob:') && !raw.startsWith('data:')) {
        this.hasUserAvatar = true;
        this.headerAvatarSrc = this.imageUrlService.getImageUrl(profileImage as string);
      } else if (raw === '') {
        this.hasUserAvatar = false;
        this.headerAvatarSrc = null;
      }
    } catch (error) {
      console.error('Error loading header profile from storage:', error);
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

  /** Opens the read-only profile view; photo changes stay on `/edit-profile` only. */
  openProfile(): void {
    void this.router.navigate(['/profile']);
  }
}
