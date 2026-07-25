import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { ActionSheetController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  bagOutline,
  banOutline,
  bookmarkOutline,
  chatbubblesOutline,
  createOutline,
  diamondOutline,
  documentTextOutline,
  heartOutline,
  informationCircleOutline,
  languageOutline,
  lockClosedOutline,
  logOutOutline,
  logoInstagram,
  mailOutline,
  notificationsOutline,
  paperPlaneOutline,
  peopleOutline,
  personAddOutline,
  refreshOutline,
  settingsOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { Router } from '@angular/router';
import { ImageUrlService } from '@app/shared/services/image-url.service';
import { ProfileCompletionService } from '@app/shared/services/profile-completion.service';
import { AuthService } from '@app/core/auth/services/auth';
import { UserSessionService } from '@app/shared/services/user-session.service';
import { TranslationService } from '@app/shared/services/translation.service';
import {
  LanguageService,
} from '@app/shared/services/language.service';
import { NotificationUnreadService } from '@app/shared/services/notification-unread.service';

interface MenuItem {
  icon: string;
  label: string;
  badge?: string;
  /** When true, row is non-interactive and shows the “coming soon” hint. */
  disabled?: boolean;
  route?: string;
  action?: 'logout' | 'contact' | 'language';
}

interface SocialLink {
  id: string;
  nameKey: string;
  handle: string;
  icon: string;
  cssClass: string;
}

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
})
export class SideMenuComponent implements OnInit, OnDestroy, ViewWillEnter {
  activeIndexTop: number | null = null;
  activeIndexBottom: number | null = null;
  router = inject(Router);
  private imageUrlService = inject(ImageUrlService);
  private profileCompletionService = inject(ProfileCompletionService);
  private authService = inject(AuthService);
  private userSession = inject(UserSessionService);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly notificationUnread = inject(NotificationUnreadService);
  private unreadSub?: Subscription;
  private languageSub?: Subscription;
  private userUpdatedSub?: Subscription;

  unreadCount = 0;
  currentLanguage = 'fa';

  // User profile data
  userName: string = 'Aliakbar Esmaeili';
  userProfileImage: string | null = null;
  // Use the service's computed signal for profile completion
  get profileCompletion(): number {
    return this.profileCompletionService.profileCompletion();
  }

  // App version
  appVersion: string = '1.0.0';

  menuItemsTop: MenuItem[] = [
    { icon: 'diamond-outline', label: 'menu.doreHealthPro', badge: 'PRO' },
    { icon: 'bag-outline', label: 'menu.myPurchases', disabled: true },
    { icon: 'heart-outline', label: 'menu.myFavorites' },
    { icon: 'bookmark-outline', label: 'menu.savedInformation' },
    { icon: 'people-outline', label: 'menu.myFriends' },
    { icon: 'chatbubbles-outline', label: 'menu.forums' },
    { icon: 'ban-outline', label: 'menu.blockedUsers', disabled: true },
  ];

  readonly socialLinks: SocialLink[] = [
    {
      id: 'instagram',
      nameKey: 'about.social.instagram',
      handle: '@dorehealth',
      icon: 'logo-instagram',
      cssClass: 'instagram',
    },
    {
      id: 'telegram',
      nameKey: 'menu.socialTelegram',
      handle: '@dorehealth',
      icon: 'paper-plane-outline',
      cssClass: 'telegram',
    },
  ];

  menuItemsBottom: MenuItem[] = [
    { icon: 'settings-outline', label: 'menu.settings', route: '/settings' },
    { icon: 'refresh-outline', label: 'menu.checkUpdates', route: '/check-version' },
    { icon: 'person-add-outline', label: 'menu.inviteFriends', route: '/invite-friends' },
    { icon: 'mail-outline', label: 'menu.contactUs', action: 'contact' },
    { icon: 'document-text-outline', label: 'menu.termsOfService', route: '/terms' },
    { icon: 'lock-closed-outline', label: 'menu.privacyPolicy', route: '/privacy-policy' },
    { icon: 'information-circle-outline', label: 'menu.aboutDoreHealth', route: '/tabs/about' },
    { icon: 'log-out-outline', label: 'menu.logOut', action: 'logout' },
  ];

  constructor() {
    addIcons({
      bagOutline,
      banOutline,
      bookmarkOutline,
      chatbubblesOutline,
      createOutline,
      diamondOutline,
      documentTextOutline,
      heartOutline,
      informationCircleOutline,
      languageOutline,
      lockClosedOutline,
      logOutOutline,
      logoInstagram,
      mailOutline,
      notificationsOutline,
      paperPlaneOutline,
      peopleOutline,
      personAddOutline,
      refreshOutline,
      settingsOutline,
    });
  }

  ngOnDestroy(): void {
    this.unreadSub?.unsubscribe();
    this.languageSub?.unsubscribe();
    this.userUpdatedSub?.unsubscribe();
  }

  get unreadBadgeText(): string {
    return this.unreadCount > 99 ? '99+' : String(this.unreadCount);
  }

  get currentLanguageLabel(): string {
    const key = 'settings.langName.' + this.currentLanguage;
    const translated = this.tr(key);
    return translated !== key ? translated : this.languageService.getLanguageName(this.currentLanguage);
  }

  async openLanguageSheet(): Promise<void> {
    const current = this.languageService.getCurrentLanguage();
    const mark = (code: string) => (current === code ? ' ✓' : '');

    const sheet = await this.actionSheetCtrl.create({
      header: this.tr('common.language'),
      buttons: [
        ...this.languageService.getLanguages().map((lang) => ({
          text: `${lang.flag} ${this.tr('settings.langName.' + lang.code)}${mark(lang.code)}`,
          handler: () => this.languageService.setLanguage(lang.code),
        })),
        { text: this.tr('common.cancel'), role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  async openNotifications(): Promise<void> {
    await this.router.navigate(['/notifications']);
  }

  async setActiveTop(index: number) {
    const item = this.menuItemsTop[index];
    if (item.disabled) {
      return;
    }
    this.activeIndexTop = index;

    // Add navigation logic for specific menu items
    if (item.label === 'menu.doreHealthPro') {
      await this.router.navigate(['/dorehealth-pro']);
    } else if (item.label === 'menu.myFavorites') {
      await this.router.navigate(['/my-favorites']);
    } else if (item.label === 'menu.savedInformation') {
      await this.router.navigate(['/saved-information']);
    } else if (item.label === 'menu.myFriends') {
      await this.router.navigate(['/my-friends']);
    } else if (item.label === 'menu.forums') {
      await this.router.navigate(['/forums']);
    }
    // Add more navigation logic for other menu items as needed
  }

  async setActiveBottom(item: MenuItem, index: number) {
    this.activeIndexBottom = index;
    if (item.action === 'logout') {
      this.logout();
      return;
    }
    if (item.action === 'contact') {
      await this.presentContactUs();
      return;
    }
    if (item.route) {
      await this.router.navigate([item.route]);
    }
  }

  private tr(key: string): string {
    return this.translation.translate(key);
  }

  /** Quick paths to support — action sheet follows app light/dark theme. */
  async presentContactUs(): Promise<void> {
    const subject = encodeURIComponent('DoreHealth — Support');
    const body = encodeURIComponent('Hi DoreHealth team,\n\n');
    const mailto = `mailto:support@dorehealth.app?subject=${subject}&body=${body}`;

    const sheet = await this.actionSheetCtrl.create({
      header: this.tr('menu.contactUs'),
      subHeader: this.tr('menu.contactUsHint'),
      buttons: [
        {
          text: this.tr('menu.contactUsEmail'),
          icon: 'mail-outline',
          handler: () => {
            window.open(mailto, '_blank', 'noopener,noreferrer');
          },
        },
        {
          text: this.tr('menu.contactUsTelegram'),
          icon: 'paper-plane-outline',
          handler: () => {
            window.open('https://t.me/dorehealth', '_blank', 'noopener,noreferrer');
          },
        },
        {
          text: this.tr('menu.contactUsInstagram'),
          icon: 'logo-instagram',
          handler: () => {
            window.open('https://instagram.com/dorehealth', '_blank', 'noopener,noreferrer');
          },
        },
        {
          text: this.tr('menu.contactUsAbout'),
          icon: 'information-circle-outline',
          handler: () => {
            void this.router.navigate(['/tabs/about']);
          },
        },
        { text: this.tr('common.cancel'), role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  /** Opens profile view; use the pencil control for `/edit-profile` (including photo). */
  async navigateToProfile() {
    await this.router.navigate(['/profile']);
  }

  logout() {
    // Call the AuthService logout method to properly clear tokens and authentication state
    this.authService.logout();
  }

  openSocialLink(platform: string) {
    const socialLinks = {
      instagram: 'https://instagram.com/dorehealth',
      telegram: 'https://t.me/dorehealth'
    };
    
    if (socialLinks[platform as keyof typeof socialLinks]) {
      window.open(socialLinks[platform as keyof typeof socialLinks], '_blank');
    }
  }

  ngOnInit() {
    this.currentLanguage = this.languageService.getCurrentLanguage();
    this.unreadCount = this.notificationUnread.getUnreadCount();

    this.loadUserProfile();

    this.unreadSub = this.notificationUnread.unreadCount$.subscribe((count) => {
      this.unreadCount = count;
    });

    this.languageSub = this.languageService.currentLanguage$.subscribe((lang) => {
      this.currentLanguage = lang;
    });

    this.userUpdatedSub = this.userSession.userUpdated$.subscribe(() => {
      this.applyProfileFromStore();
    });
  }

  ionViewWillEnter(): void {
    this.loadUserProfile();
  }

  private loadUserProfile() {
    this.profileCompletionService.refreshFromAPI().subscribe({
      next: (merged) => {
        if (merged) {
          this.userName = merged.fullName || merged.name || this.userName;
          // Same resolved URL as profile page (absolute API URLs unchanged).
          this.userProfileImage = merged.profileImage;
        }
      },
    });

    this.applyProfileFromStore();
  }

  private applyProfileFromStore(): void {
    try {
      const userInfoStore = this.userSession.getUserInfoStoreOrEmpty();
      const user = (userInfoStore.user ?? {}) as Record<string, unknown>;
      const fullName = user['fullName'];
      const name = user['name'];
      this.userName =
        (typeof fullName === 'string' && fullName) ||
        (typeof name === 'string' && name) ||
        this.userName;
      const profileImage = user['profileImage'];
      if (typeof profileImage === 'string' && profileImage.trim()) {
        this.userProfileImage = this.imageUrlService.getImageUrl(profileImage);
      }
    } catch (error) {
      console.error('Error loading user profile from localStorage:', error);
    }
  }
}
