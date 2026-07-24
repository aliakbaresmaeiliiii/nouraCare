import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminThemeService } from '../../data/services/admin-theme.service';
import { AdminToastService } from '../../data/services/admin-toast.service';

@Component({
  selector: 'app-admin-settings-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-settings.page.html',
  styleUrl: './admin-settings.page.scss',
})
export class AdminSettingsPage {
  private readonly themeSvc = inject(AdminThemeService);
  private readonly toast = inject(AdminToastService);

  readonly tab = signal<
    'general' | 'appearance' | 'localization' | 'flags' | 'keys' | 'smtp' | 'security'
  >('general');

  orgName = 'Dore Health';
  supportEmail = 'ops@dore.health';
  locale = 'en';
  timezone = 'Asia/Tehran';
  smtpHost = 'smtp.dore.health';
  smtpPort = '587';
  twoFaRequired = true;
  sessionTimeout = '8h';

  readonly flags = signal([
    { key: 'pregnancy_v2', label: 'Pregnancy Mode v2', enabled: true },
    { key: 'shop_checkout', label: 'Shop checkout', enabled: true },
    { key: 'community_secret', label: 'Secret chats', enabled: false },
    { key: 'ai_insights', label: 'AI insights beta', enabled: false },
  ]);

  readonly apiKeys = [
    { name: 'Production', key: 'dh_live_••••••••9f2a', created: '2026-01-12' },
    { name: 'Staging', key: 'dh_test_••••••••c41b', created: '2026-03-02' },
  ];

  setTheme(theme: 'light' | 'dark'): void {
    this.themeSvc.set(theme);
  }

  save(): void {
    this.toast.show('Settings saved (mock)', 'success');
  }

  toggleFlag(key: string): void {
    this.flags.update((list) =>
      list.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)),
    );
  }
}
