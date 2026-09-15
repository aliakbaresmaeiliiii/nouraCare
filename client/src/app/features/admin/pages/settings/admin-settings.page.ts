import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { TranslationService } from '@app/shared/services/translation.service';
import { AdminThemeService } from '../../data/services/admin-theme.service';
import { AdminToastService } from '../../data/services/admin-toast.service';

type SettingsTab =
  | 'general'
  | 'appearance'
  | 'localization'
  | 'flags'
  | 'keys'
  | 'smtp'
  | 'security';

@Component({
  selector: 'app-admin-settings-page',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  templateUrl: './admin-settings.page.html',
  styleUrl: './admin-settings.page.scss',
})
export class AdminSettingsPage {
  private readonly themeSvc = inject(AdminThemeService);
  private readonly toast = inject(AdminToastService);
  private readonly i18n = inject(TranslationService);

  readonly tab = signal<SettingsTab>('general');

  readonly tabs: { id: SettingsTab; labelKey: string }[] = [
    { id: 'general', labelKey: 'admin.settings.tab.general' },
    { id: 'appearance', labelKey: 'admin.settings.tab.appearance' },
    { id: 'localization', labelKey: 'admin.settings.tab.localization' },
    { id: 'flags', labelKey: 'admin.settings.tab.flags' },
    { id: 'keys', labelKey: 'admin.settings.tab.keys' },
    { id: 'smtp', labelKey: 'admin.settings.tab.smtp' },
    { id: 'security', labelKey: 'admin.settings.tab.security' },
  ];

  orgName = 'Dore Health';
  supportEmail = 'ops@dore.health';
  locale = 'en';
  timezone = 'Asia/Tehran';
  smtpHost = 'smtp.dore.health';
  smtpPort = '587';
  twoFaRequired = true;
  sessionTimeout = '8h';

  readonly flags = signal([
    {
      key: 'pregnancy_v2',
      labelKey: 'admin.settings.flag.pregnancy_v2',
      enabled: true,
    },
    {
      key: 'shop_checkout',
      labelKey: 'admin.settings.flag.shop_checkout',
      enabled: true,
    },
    {
      key: 'community_secret',
      labelKey: 'admin.settings.flag.community_secret',
      enabled: false,
    },
    {
      key: 'ai_insights',
      labelKey: 'admin.settings.flag.ai_insights',
      enabled: false,
    },
  ]);

  readonly apiKeys = [
    {
      nameKey: 'admin.settings.api.production',
      key: 'dh_live_••••••••9f2a',
      created: '2026-01-12',
    },
    {
      nameKey: 'admin.settings.api.staging',
      key: 'dh_test_••••••••c41b',
      created: '2026-03-02',
    },
  ];

  setTheme(theme: 'light' | 'dark'): void {
    this.themeSvc.set(theme);
  }

  save(): void {
    this.toast.show(this.i18n.translate('admin.settings.saved'), 'success');
  }

  toggleFlag(key: string): void {
    this.flags.update((list) =>
      list.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)),
    );
  }
}
