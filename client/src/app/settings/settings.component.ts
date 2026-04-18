import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActionSheetController } from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { Router } from '@angular/router';
import { AuthService } from '../auth/services/auth';
import { ImageUrlService } from '../shared/services/image-url.service';
import { UserSessionService } from '../shared/services/user-session.service';
import {
  ThemePreference,
  ThemeService,
} from '../shared/services/theme.service';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'toggle' | 'link' | 'button';
  value?: boolean;
  action?: () => void;
  route?: string;
}

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
})
export class SettingsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private themeService = inject(ThemeService);
  private actionSheetCtrl = inject(ActionSheetController);
  private authService = inject(AuthService);
  private userSession = inject(UserSessionService);
  private imageUrlService = inject(ImageUrlService);
  private appearanceSub?: Subscription;

  isLoading = false;
  errorMessage = '';
  hasUserAvatar = false;
  autoSyncEnabled = true;

  displayName = 'Account';
  displayEmail = '';
  avatarSrc = '';
  showVerifiedBadge = false;
  readonly accountStatusLabel = 'Signed in';

  // Account Settings
  accountSettings: SettingItem[] = [
    {
      id: 'profile',
      title: 'Profile Settings',
      subtitle: 'Edit your personal information',
      icon: 'person-outline',
      type: 'link',
      route: '/edit-profile',
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Manage your privacy settings',
      icon: 'shield-outline',
      type: 'link',
      route: '/privacy-settings',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Control your notification preferences',
      icon: 'notifications-outline',
      type: 'link',
      route: '/notification-settings',
    },
  ];

  // App Settings
  appSettings: SettingItem[] = [
    {
      id: 'language',
      title: 'Language',
      subtitle: 'English',
      icon: 'language-outline',
      type: 'link',
      route: '/language-settings',
    },
    {
      id: 'theme',
      title: 'Appearance',
      subtitle: '',
      icon: 'color-palette-outline',
      type: 'button',
      action: () => {
        void this.openAppearanceSheet();
      },
    },
    {
      id: 'autoSync',
      title: 'Auto Sync',
      subtitle: 'Automatically sync your data',
      icon: 'sync-outline',
      type: 'toggle',
      value: true,
    },
    {
      id: 'dataUsage',
      title: 'Data Usage',
      subtitle: 'Manage your data consumption',
      icon: 'cellular-outline',
      type: 'link',
      route: '/data-usage',
    },
  ];

  // Support & About
  supportSettings: SettingItem[] = [
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help-circle-outline',
      type: 'link',
      route: '/help-support',
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      subtitle: 'Share your thoughts with us',
      icon: 'chatbubble-outline',
      type: 'button',
      action: () => this.sendFeedback(),
    },
    {
      id: 'about',
      title: 'About NouraCare',
      subtitle: 'Version 1.0.0',
      icon: 'information-circle-outline',
      type: 'link',
      route: '/about',
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      subtitle: 'Read our terms and conditions',
      icon: 'document-text-outline',
      type: 'link',
      route: '/terms',
    },
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      subtitle: 'How we handle your data',
      icon: 'lock-closed-outline',
      type: 'link',
      route: '/privacy-policy',
    },
  ];

  // Account Actions
  accountActions: SettingItem[] = [
    {
      id: 'export',
      title: 'Export Data',
      subtitle: 'Download your data',
      icon: 'download-outline',
      type: 'button',
      action: () => this.exportData(),
    },
    {
      id: 'delete',
      title: 'Delete Account',
      subtitle: 'Permanently delete your account',
      icon: 'trash-outline',
      type: 'button',
      action: () => this.deleteAccount(),
    },
  ];

  ngOnInit() {
    this.themeService.syncDomFromPreference();
    this.refreshAccountHeader();
    this.syncThemeSettingRow();
    this.appearanceSub = this.themeService.appearanceChanged$.subscribe(() =>
      this.syncThemeSettingRow(),
    );
    this.loadSettings();
  }

  ngOnDestroy() {
    this.appearanceSub?.unsubscribe();
  }

  loadSettings() {
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      this.loadSavedSettings();
    }, 500);
  }

  private syncThemeSettingRow(): void {
    const themeSetting = this.appSettings.find((s) => s.id === 'theme');
    if (themeSetting) {
      themeSetting.subtitle = this.themeService.subtitleForCurrent();
    }
  }

  async openAppearanceSheet(): Promise<void> {
    const current = this.themeService.getPreference();
    const mark = (p: ThemePreference) => (current === p ? ' ✓' : '');

    const sheet = await this.actionSheetCtrl.create({
      header: 'Appearance',
      buttons: [
        {
          text: `Light${mark('light')}`,
          handler: () => this.themeService.setPreference('light'),
        },
        {
          text: `Dark${mark('dark')}`,
          handler: () => this.themeService.setPreference('dark'),
        },
        {
          text: `System (device)${mark('system')}`,
          handler: () => this.themeService.setPreference('system'),
        },
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
    });
    await sheet.present();
  }

  loadSavedSettings() {
    this.refreshAccountHeader();
    const savedAutoSync = localStorage.getItem('autoSync');
    if (savedAutoSync !== null) {
      this.autoSyncEnabled = savedAutoSync === 'true';
    }
    const autoSyncSetting = this.appSettings.find((s) => s.id === 'autoSync');
    if (autoSyncSetting) {
      autoSyncSetting.value = this.autoSyncEnabled;
    }
    this.syncThemeSettingRow();
  }

  private refreshAccountHeader(): void {
    const store = this.userSession.parseUserInfoStore();
    const rawUser = store?.user ?? store;
    const u =
      rawUser && typeof rawUser === 'object' && !Array.isArray(rawUser)
        ? (rawUser as Record<string, unknown>)
        : null;

    if (!u) {
      this.displayName = 'Account';
      this.displayEmail = '';
      this.hasUserAvatar = false;
      this.avatarSrc = '';
      this.showVerifiedBadge = false;
      return;
    }

    const email = String(u['email'] ?? '').trim();
    const nameRaw = String(u['fullName'] ?? u['name'] ?? '').trim();
    const derived = email.includes('@') ? email.split('@')[0] : '';
    this.displayName = nameRaw || derived || 'Account';
    this.displayEmail = email;
    const pic = (u['profileImage'] ?? u['profile_img'] ?? '') as string | null;
    const picStr = typeof pic === 'string' ? pic.trim() : '';
    this.hasUserAvatar = picStr.length > 0;
    this.avatarSrc = this.hasUserAvatar
      ? this.imageUrlService.getImageUrl(picStr)
      : '';
    this.showVerifiedBadge = Boolean(u['isVerified']);
  }

  onSettingClick(setting: SettingItem) {
    if (setting.type === 'toggle') {
      return;
    } else if (setting.type === 'link' && setting.route) {
      this.router.navigate([setting.route]);
    } else if (setting.type === 'button' && setting.action) {
      setting.action();
    }
  }

  onAutoSyncIonChange(event: CustomEvent<{ checked: boolean }>): void {
    this.onAutoSyncToggle(!!event.detail?.checked);
  }

  onAutoSyncToggle(checked: boolean) {
    this.autoSyncEnabled = checked;
    const autoSyncSetting = this.appSettings.find((s) => s.id === 'autoSync');
    if (autoSyncSetting) {
      autoSyncSetting.value = checked;
    }
    localStorage.setItem('autoSync', String(checked));
    this.showSuccessAlert(`Auto sync ${checked ? 'enabled' : 'disabled'}`);
  }

  sendFeedback() {
    const subject = encodeURIComponent('NouraCare App Feedback');
    const body = encodeURIComponent(
      'Hi NouraCare team,\n\nI would like to share the following feedback:\n\n',
    );
    window.open(`mailto:support@nouracare.app?subject=${subject}&body=${body}`);
  }

  exportData() {
    this.showSuccessAlert('Data export started. You will receive an email when ready.');
    setTimeout(() => {
      this.showSuccessAlert('Your data has been exported and sent to your email.');
    }, 2000);
  }

  deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.showErrorAlert('Account deletion requested. Please contact support for confirmation.');
    }
  }

  goBack() {
    this.router.navigate(['/tabs']);
  }

  logout() {
    if (!confirm('Are you sure you want to sign out?')) {
      return;
    }
    this.authService.logout();
  }

  private showSuccessAlert(message: string): void {
    const alert = document.createElement('ion-alert');
    alert.header = 'Success';
    alert.message = message;
    alert.buttons = ['OK'];
    document.body.appendChild(alert);
    alert.present();
  }

  private showErrorAlert(message: string): void {
    const alert = document.createElement('ion-alert');
    alert.header = 'Error';
    alert.message = message;
    alert.buttons = ['OK'];
    document.body.appendChild(alert);
    alert.present();
  }
}
