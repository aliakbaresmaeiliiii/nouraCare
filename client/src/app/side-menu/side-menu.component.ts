import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { ActionSheetController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  logoInstagram,
  mailOutline,
  moonOutline,
  paperPlaneOutline,
  phonePortraitOutline,
  sunnyOutline,
} from 'ionicons/icons';
import { merge, Subscription } from 'rxjs';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { Router } from '@angular/router';
import { ImageUrlService } from '../shared/services/image-url.service';
import { ProfileCompletionService } from '../shared/services/profile-completion.service';
import { AuthService } from '../auth/services/auth';
import { UserSessionService } from '../shared/services/user-session.service';
import {
  ThemePreference,
  ThemeService,
} from '../shared/services/theme.service';
import { TranslationService } from '../shared/services/translation.service';

interface MenuItem {
  icon: string;
  label: string;
  badge?: string;
  /** When true, row is non-interactive and shows the “coming soon” hint. */
  disabled?: boolean;
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
  private themeService = inject(ThemeService);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly translation = inject(TranslationService);
  private themeSub?: Subscription;

  /** Bound to the appearance segment (light / dark / system). */
  themePreference: ThemePreference = 'system';
  /** Shown under the segment when following the device theme. */
  themeHint = '';

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
    { icon: 'diamond-outline', label: 'menu.nouracarePro', badge: 'PRO' },
    { icon: 'bag-outline', label: 'menu.myPurchases', disabled: true },
    { icon: 'heart-outline', label: 'menu.myFavorites' },
    { icon: 'bookmark-outline', label: 'menu.savedInformation' },
    { icon: 'people-outline', label: 'menu.myFriends' },
    { icon: 'chatbubbles-outline', label: 'menu.forums' },
    { icon: 'ban-outline', label: 'menu.blockedUsers', disabled: true },
  ];

  menuItemsBottom: MenuItem[] = [
    { icon: 'settings-outline', label: 'menu.settings' },
    { icon: 'refresh-outline', label: 'menu.checkUpdates' },
    { icon: 'person-add-outline', label: 'menu.inviteFriends' },
    { icon: 'notifications-outline', label: 'menu.notifications' },
    { icon: 'mail-outline', label: 'menu.contactUs' },
    { icon: 'information-circle-outline', label: 'menu.aboutNouracare' },
    { icon: 'log-out-outline', label: 'menu.logOut' },
  ];

  constructor() {
    addIcons({
      logoInstagram,
      mailOutline,
      paperPlaneOutline,
      sunnyOutline,
      moonOutline,
      phonePortraitOutline,
    });
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
  }

  onThemeSegmentChange(ev: Event): void {
    const ce = ev as CustomEvent<{ value?: string | number }>;
    const fromDetail = ce.detail?.value;
    const target = ce.target as HTMLIonSegmentElement | null;
    const fromTarget = target?.value;
    const raw =
      fromDetail !== undefined && fromDetail !== null && fromDetail !== ''
        ? String(fromDetail)
        : fromTarget !== undefined && fromTarget !== null && fromTarget !== ''
          ? String(fromTarget)
          : '';
    const v = raw as ThemePreference;
    if (v === 'light' || v === 'dark' || v === 'system') {
      this.themeService.setPreference(v);
    }
  }

  private syncThemeFromService(): void {
    this.themePreference = this.themeService.getPreference();
    this.themeHint =
      this.themePreference === 'system'
        ? this.themeService.subtitleForCurrent()
        : '';
  }

  async setActiveTop(index: number) {
    const item = this.menuItemsTop[index];
    if (item.disabled) {
      return;
    }
    this.activeIndexTop = index;

    // Add navigation logic for specific menu items
    if (item.label === 'menu.myFavorites') {
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
    if (item.label === 'menu.logOut') {
      this.logout();
    } else if (item.label === 'menu.aboutNouracare') {
      await this.router.navigate(['/tabs/about']);
    } else if (item.label === 'menu.checkUpdates') {
      await this.router.navigate(['/check-version']);
    } else if (item.label === 'menu.settings') {
      await this.router.navigate(['/settings']);
    } else if (item.label === 'menu.inviteFriends') {
      await this.router.navigate(['/invite-friends']);
    } else if (item.label === 'menu.notifications') {
      await this.router.navigate(['/notifications']);
    } else if (item.label === 'menu.contactUs') {
      await this.presentContactUs();
    }
  }

  private tr(key: string): string {
    return this.translation.translate(key);
  }

  /** Quick paths to support — action sheet follows app light/dark theme. */
  async presentContactUs(): Promise<void> {
    const subject = encodeURIComponent('NouraCare — Support');
    const body = encodeURIComponent('Hi NouraCare team,\n\n');
    const mailto = `mailto:support@nouracare.app?subject=${subject}&body=${body}`;

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
            window.open('https://t.me/nouracare', '_blank', 'noopener,noreferrer');
          },
        },
        {
          text: this.tr('menu.contactUsInstagram'),
          icon: 'logo-instagram',
          handler: () => {
            window.open('https://instagram.com/nouracare', '_blank', 'noopener,noreferrer');
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

  async navigateToProfile() {
    await this.router.navigate(['/profile']);
  }

  logout() {
    // Call the AuthService logout method to properly clear tokens and authentication state
    this.authService.logout();
  }

  openSocialLink(platform: string) {
    const socialLinks = {
      instagram: 'https://instagram.com/nouracare',
      telegram: 'https://t.me/nouracare'
    };
    
    if (socialLinks[platform as keyof typeof socialLinks]) {
      window.open(socialLinks[platform as keyof typeof socialLinks], '_blank');
    }
  }

  ngOnInit() {
    this.loadUserProfile();
    this.syncThemeFromService();
    this.themeSub = merge(
      this.themeService.preferenceChanges$,
      this.themeService.appearanceChanged$,
    ).subscribe(() => this.syncThemeFromService());
  }

  ionViewWillEnter(): void {
    this.loadUserProfile();
    this.syncThemeFromService();
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
      this.userProfileImage =
        this.userProfileImage ||
        this.imageUrlService.getImageUrl(
          typeof profileImage === 'string' ? profileImage : null,
        );
    } catch (error) {
      console.error('Error loading user profile from localStorage:', error);
    }
  }
}
