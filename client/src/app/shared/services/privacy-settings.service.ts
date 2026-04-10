import { Injectable } from '@angular/core';

export interface PrivacySettings {
  hideSensitiveNotifications: boolean;
  appLockEnabled: boolean;
  appLockMethod: 'pin' | 'biometric';
  showAppPreviewContent: boolean;
  allowDataSharing: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class PrivacySettingsService {
  private readonly STORAGE_KEY = 'privacy_settings_v1';

  private readonly defaults: PrivacySettings = {
    hideSensitiveNotifications: true,
    appLockEnabled: false,
    appLockMethod: 'pin',
    showAppPreviewContent: false,
    allowDataSharing: false,
  };

  getSettings(): PrivacySettings {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) {
        return { ...this.defaults };
      }
      const parsed = JSON.parse(raw) as Partial<PrivacySettings>;
      return {
        ...this.defaults,
        ...parsed,
      };
    } catch {
      return { ...this.defaults };
    }
  }

  updateSettings(partial: Partial<PrivacySettings>): PrivacySettings {
    const next = {
      ...this.getSettings(),
      ...partial,
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
    return next;
  }

  resetToDefaults(): PrivacySettings {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.defaults));
    return { ...this.defaults };
  }
}
