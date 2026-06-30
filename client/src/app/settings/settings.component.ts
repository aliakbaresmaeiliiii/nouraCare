import {

  ChangeDetectorRef,

  Component,

  OnDestroy,

  OnInit,

  inject,

} from '@angular/core';

import { Subscription } from 'rxjs';

import {

  ActionSheetController,

  AlertController,

} from '@ionic/angular/standalone';

import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

import { Router } from '@angular/router';

import { AuthService } from '../auth/services/auth';

import { ImageUrlService } from '../shared/services/image-url.service';

import { UserSessionService } from '../shared/services/user-session.service';

import {

  ThemePreference,

  ThemeService,

} from '../shared/services/theme.service';

import { TranslationService } from '../shared/services/translation.service';

import { LanguageService, LANGUAGE_SWITCHING_ENABLED } from '../shared/services/language.service';

import { User } from '../shared/services/user';

import { firstValueFrom } from 'rxjs';



interface SettingItem {

  id: string;

  titleKey: string;

  subtitleKey?: string;

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

  host: { class: 'ion-page' },

})

export class SettingsComponent implements OnInit, OnDestroy {

  private readonly router = inject(Router);

  private readonly themeService = inject(ThemeService);

  private readonly actionSheetCtrl = inject(ActionSheetController);

  private readonly alertController = inject(AlertController);

  private readonly authService = inject(AuthService);

  private readonly userSession = inject(UserSessionService);

  private readonly imageUrlService = inject(ImageUrlService);

  private readonly translation = inject(TranslationService);

  private readonly languageService = inject(LanguageService);

  private readonly userService = inject(User);

  private readonly cdr = inject(ChangeDetectorRef);

  isExportingData = false;

  private appearanceSub?: Subscription;

  private languageSub?: Subscription;



  errorMessage = '';

  hasUserAvatar = false;

  autoSyncEnabled = true;



  displayName = '';

  displayEmail = '';

  avatarSrc = '';

  showVerifiedBadge = false;



  readonly appVersion = '1.0.0';



  accountSettings: SettingItem[] = [

    {

      id: 'profile',

      titleKey: 'settings.profile.title',

      subtitleKey: 'settings.profile.subtitle',

      icon: 'person-outline',

      type: 'link',

      route: '/edit-profile',

    },

    {

      id: 'privacy',

      titleKey: 'settings.privacy.title',

      subtitleKey: 'settings.privacy.subtitle',

      icon: 'shield-outline',

      type: 'link',

      route: '/privacy-settings',

    },

    {

      id: 'notifications',

      titleKey: 'settings.notifications.title',

      subtitleKey: 'settings.notifications.subtitle',

      icon: 'notifications-outline',

      type: 'link',

      route: '/notifications',

    },

  ];



  readonly languageSwitchingEnabled = LANGUAGE_SWITCHING_ENABLED;

  appSettings: SettingItem[] = [

    ...(LANGUAGE_SWITCHING_ENABLED
      ? [
          {
            id: 'language',
            titleKey: 'common.language',
            subtitleKey: 'settings.language.subtitle',
            icon: 'language-outline',
            type: 'button' as const,
            action: () => {
              void this.openLanguageSheet();
            },
          },
        ]
      : []),

    {

      id: 'theme',

      titleKey: 'menu.appearance',

      icon: 'color-palette-outline',

      type: 'button',

      action: () => {

        void this.openAppearanceSheet();

      },

    },

    {

      id: 'autoSync',

      titleKey: 'settings.autoSync.title',

      subtitleKey: 'settings.autoSync.subtitle',

      icon: 'sync-outline',

      type: 'toggle',

      value: true,

    },

    {

      id: 'dataUsage',

      titleKey: 'settings.dataUsage.title',

      subtitleKey: 'settings.dataUsage.subtitle',

      icon: 'cellular-outline',

      type: 'link',

      route: '/data-usage',

    },

  ];



  supportSettings: SettingItem[] = [

    {

      id: 'help',

      titleKey: 'settings.help.title',

      subtitleKey: 'settings.help.subtitle',

      icon: 'help-circle-outline',

      type: 'link',

      route: '/help-support',

    },

    {

      id: 'feedback',

      titleKey: 'settings.feedback.title',

      subtitleKey: 'settings.feedback.subtitle',

      icon: 'chatbubble-outline',

      type: 'button',

      action: () => this.sendFeedback(),

    },

    {

      id: 'terms',

      titleKey: 'settings.terms.title',

      subtitleKey: 'settings.terms.subtitle',

      icon: 'document-text-outline',

      type: 'link',

      route: '/terms',

    },

    {

      id: 'privacy-policy',

      titleKey: 'settings.privacyPolicy.title',

      subtitleKey: 'settings.privacyPolicy.subtitle',

      icon: 'lock-closed-outline',

      type: 'link',

      route: '/privacy-policy',

    },

    {

      id: 'about',

      titleKey: 'menu.aboutDoreHealth',

      subtitleKey: 'settings.about.subtitle',

      icon: 'information-circle-outline',

      type: 'link',

      route: '/tabs/about',

    },

  ];



  accountActions: SettingItem[] = [

    {

      id: 'export',

      titleKey: 'settings.export.title',

      subtitleKey: 'settings.export.subtitle',

      icon: 'download-outline',

      type: 'button',

      action: () => {

        void this.exportData();

      },

    },

    {

      id: 'delete',

      titleKey: 'settings.delete.title',

      subtitleKey: 'settings.delete.subtitle',

      icon: 'trash-outline',

      type: 'button',

      action: () => {

        void this.deleteAccount();

      },

    },

  ];



  ngOnInit() {

    this.themeService.syncDomFromPreference();

    this.refreshAccountHeader();

    this.languageSub = this.languageService.currentLanguage$.subscribe(() => {

      this.cdr.markForCheck();

    });

    this.appearanceSub = this.themeService.appearanceChanged$.subscribe(() => {

      this.cdr.markForCheck();

    });

    this.loadSavedSettings();

  }



  ngOnDestroy() {

    this.appearanceSub?.unsubscribe();

    this.languageSub?.unsubscribe();

  }



  get accountStatusLabel(): string {

    return this.t('settings.signedIn');

  }



  getSettingSubtitle(setting: SettingItem): string {

    if (setting.id === 'language') {

      return this.currentLanguageLabel();

    }

    if (setting.id === 'theme') {

      return this.themeSubtitle();

    }

    if (setting.id === 'about' && setting.subtitleKey) {

      return this.tParams(setting.subtitleKey, { version: this.appVersion });

    }

    if (setting.subtitleKey) {

      return this.t(setting.subtitleKey);

    }

    return '';

  }



  async openLanguageSheet(): Promise<void> {

    const current = this.languageService.getCurrentLanguage();

    const mark = (code: string) => (current === code ? ' ✓' : '');



    const sheet = await this.actionSheetCtrl.create({

      header: this.t('common.language'),

      buttons: [

        ...this.languageService.getLanguages().map((lang) => ({

          text: `${lang.flag} ${this.t(`settings.langName.${lang.code}`)}${mark(lang.code)}`,

          handler: () => this.languageService.setLanguage(lang.code),

        })),

        { text: this.t('common.cancel'), role: 'cancel' as const },

      ],

    });

    await sheet.present();

  }



  async openAppearanceSheet(): Promise<void> {

    const current = this.themeService.getPreference();

    const mark = (p: ThemePreference) => (current === p ? ' ✓' : '');



    const sheet = await this.actionSheetCtrl.create({

      header: this.t('menu.appearance'),

      buttons: [

        {

          text: `${this.t('menu.themeLight')}${mark('light')}`,

          handler: () => this.themeService.setPreference('light'),

        },

        {

          text: `${this.t('menu.themeDark')}${mark('dark')}`,

          handler: () => this.themeService.setPreference('dark'),

        },

        {

          text: `${this.t('settings.appearanceSystemDevice')}${mark('system')}`,

          handler: () => this.themeService.setPreference('system'),

        },

        { text: this.t('common.cancel'), role: 'cancel' },

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

    this.cdr.markForCheck();

  }



  private refreshAccountHeader(): void {

    const store = this.userSession.parseUserInfoStore();

    const rawUser = store?.user ?? store;

    const u =

      rawUser && typeof rawUser === 'object' && !Array.isArray(rawUser)

        ? (rawUser as Record<string, unknown>)

        : null;



    if (!u) {

      this.displayName = this.t('settings.accountDefault');

      this.displayEmail = '';

      this.hasUserAvatar = false;

      this.avatarSrc = '';

      this.showVerifiedBadge = false;

      return;

    }



    const email = String(u['email'] ?? '').trim();

    const nameRaw = String(u['fullName'] ?? u['name'] ?? '').trim();

    const derived = email.includes('@') ? email.split('@')[0] : '';

    this.displayName = nameRaw || derived || this.t('settings.accountDefault');

    this.displayEmail = email;

    const pic = (u['profileImage'] ?? u['profile_img'] ?? '') as string | null;

    const picStr = typeof pic === 'string' ? pic.trim() : '';

    this.hasUserAvatar = picStr.length > 0;

    this.avatarSrc = this.hasUserAvatar

      ? this.imageUrlService.getImageUrl(picStr)

      : '';

    this.showVerifiedBadge = Boolean(u['isVerified']);

  }



  private currentLanguageLabel(): string {

    const code = this.languageService.getCurrentLanguage();

    const key = `settings.langName.${code}`;

    const translated = this.translation.translate(key);

    return translated !== key ? translated : this.languageService.getLanguageName(code);

  }



  private themeSubtitle(): string {

    const preference = this.themeService.getPreference();

    if (preference === 'system') {

      const mode = this.themeService.effectiveIsDark()

        ? this.t('menu.themeDark')

        : this.t('menu.themeLight');

      return this.tParams('settings.themeSystemSubtitle', { mode });

    }

    if (preference === 'dark') {

      return this.t('menu.themeDark');

    }

    if (preference === 'light') {

      return this.t('menu.themeLight');

    }

    return this.t('menu.themeSystem');

  }



  onSettingClick(setting: SettingItem) {

    if (setting.type === 'toggle') {

      return;

    }

    if (setting.type === 'link' && setting.route) {

      void this.router.navigate([setting.route]);

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

    void this.showSuccessAlert(

      this.t(checked ? 'settings.autoSyncEnabled' : 'settings.autoSyncDisabled'),

    );

  }



  sendFeedback() {

    const subject = encodeURIComponent('DoreHealth App Feedback');

    const body = encodeURIComponent(

      'Hi DoreHealth team,\n\nI would like to share the following feedback:\n\n',

    );

    window.open(`mailto:support@dorehealth.app?subject=${subject}&body=${body}`);

  }



  async exportData() {

    if (this.isExportingData) {

      return;

    }



    const email = this.getRegisteredEmail();

    if (!email) {

      await this.showEmailRequiredAlert();

      return;

    }



    this.isExportingData = true;

    try {

      await firstValueFrom(this.userService.requestDataExport());

      await this.showSuccessAlert(

        this.tParams('settings.exportDone', { email }),

      );

    } catch {

      await this.showErrorAlert(this.t('settings.exportFailed'));

    } finally {

      this.isExportingData = false;

      this.cdr.markForCheck();

    }

  }



  private getRegisteredEmail(): string {

    const store = this.userSession.parseUserInfoStore();

    const rawUser = store?.user ?? store;

    const u =

      rawUser && typeof rawUser === 'object' && !Array.isArray(rawUser)

        ? (rawUser as Record<string, unknown>)

        : null;

    const email = String(u?.['email'] ?? '').trim().toLowerCase();

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';

  }



  private async showEmailRequiredAlert(): Promise<void> {

    const alert = await this.alertController.create({

      header: this.t('settings.export.title'),

      message: this.t('settings.exportEmailRequired'),

      buttons: [

        { text: this.t('common.cancel'), role: 'cancel' },

        {

          text: this.t('settings.exportAddEmail'),

          handler: () => {

            void this.router.navigate(['/edit-profile'], {

              queryParams: { focus: 'email' },

            });

          },

        },

      ],

    });

    await alert.present();

  }



  async deleteAccount() {
    const confirmed = await this.confirm(
      this.t('settings.delete.title'),
      this.t('settings.deleteConfirm'),
      this.t('settings.delete.confirm'),
    );

    if (!confirmed) {
      return;
    }

    try {
      await firstValueFrom(this.userService.deleteMyAccount());
      this.authService.logout();
      void this.router.navigate(['/auth/sign-in']);
    } catch {
      await this.showErrorAlert(this.t('settings.deleteRequested'));
    }
  }



  goBack() {

    void this.router.navigate(['/tabs/home']);

  }



  logout() {

    void this.confirm(

      this.t('menu.logOut'),

      this.t('settings.signOutConfirm'),

      this.t('menu.logOut'),

    ).then((confirmed) => {

      if (confirmed) {

        this.authService.logout();

      }

    });

  }



  private async confirm(

    header: string,

    message: string,

    confirmText: string,

  ): Promise<boolean> {

    const alert = await this.alertController.create({

      header,

      message,

      buttons: [

        { text: this.t('common.cancel'), role: 'cancel' },

        { text: confirmText, role: 'destructive' },

      ],

    });

    await alert.present();

    const { role } = await alert.onDidDismiss();

    return role === 'destructive';

  }



  private async showSuccessAlert(message: string): Promise<void> {

    const alert = await this.alertController.create({

      header: this.t('common.success'),

      message,

      buttons: [this.t('common.ok')],

    });

    await alert.present();

  }



  private async showErrorAlert(message: string): Promise<void> {

    const alert = await this.alertController.create({

      header: this.t('common.error'),

      message,

      buttons: [this.t('common.ok')],

    });

    await alert.present();

  }



  private t(key: string): string {

    return this.translation.translate(key);

  }



  private tParams(key: string, params: Record<string, string | number>): string {

    return this.translation.translateParams(key, params);

  }

}


