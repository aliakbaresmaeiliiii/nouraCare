import { Component, OnInit, inject } from '@angular/core';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { Router } from '@angular/router';

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
export class SettingsComponent implements OnInit {
  private router = inject(Router);
  paletteToggle = false;
  isLoading = false;
  errorMessage = '';
  hasUserAvatar = false;

  // Account Settings
  accountSettings: SettingItem[] = [
    {
      id: 'profile',
      title: 'Profile Settings',
      subtitle: 'Edit your personal information',
      icon: 'person-outline',
      type: 'link',
      route: '/edit-profile'
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      subtitle: 'Manage your privacy settings',
      icon: 'shield-outline',
      type: 'link',
      route: '/privacy-settings'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      subtitle: 'Control your notification preferences',
      icon: 'notifications-outline',
      type: 'link',
      route: '/notification-settings'
    }
  ];

  // App Settings
  appSettings: SettingItem[] = [
    {
      id: 'language',
      title: 'Language',
      subtitle: 'English',
      icon: 'language-outline',
      type: 'link',
      route: '/language-settings'
    },
    {
      id: 'theme',
      title: 'Dark Mode',
      subtitle: 'Use dark theme',
      icon: 'moon-outline',
      type: 'toggle',
      value: false,
      action: () => this.toggleTheme()
    },
    {
      id: 'autoSync',
      title: 'Auto Sync',
      subtitle: 'Automatically sync your data',
      icon: 'sync-outline',
      type: 'toggle',
      value: true,
      action: () => this.toggleAutoSync()
    },
    {
      id: 'dataUsage',
      title: 'Data Usage',
      subtitle: 'Manage your data consumption',
      icon: 'cellular-outline',
      type: 'link',
      route: '/data-usage'
    }
  ];

  // Support & About
  supportSettings: SettingItem[] = [
    {
      id: 'help',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      icon: 'help-circle-outline',
      type: 'link',
      route: '/help-support'
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      subtitle: 'Share your thoughts with us',
      icon: 'chatbubble-outline',
      type: 'button',
      action: () => this.sendFeedback()
    },
    {
      id: 'about',
      title: 'About Gahvareh',
      subtitle: 'Version 1.0.0',
      icon: 'information-circle-outline',
      type: 'link',
      route: '/about'
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      subtitle: 'Read our terms and conditions',
      icon: 'document-text-outline',
      type: 'link',
      route: '/terms'
    },
    {
      id: 'privacy-policy',
      title: 'Privacy Policy',
      subtitle: 'How we handle your data',
      icon: 'lock-closed-outline',
      type: 'link',
      route: '/privacy-policy'
    }
  ];

  // Account Actions
  accountActions: SettingItem[] = [
    {
      id: 'export',
      title: 'Export Data',
      subtitle: 'Download your data',
      icon: 'download-outline',
      type: 'button',
      action: () => this.exportData()
    },
    {
      id: 'delete',
      title: 'Delete Account',
      subtitle: 'Permanently delete your account',
      icon: 'trash-outline',
      type: 'button',
      action: () => this.deleteAccount()
    }
  ];

  constructor() { }

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.isLoading = true;
    // Simulate loading settings from storage/API
    setTimeout(() => {
      this.isLoading = false;
      // Load saved settings from localStorage
      this.loadSavedSettings();
    }, 500);
  }

  initializeDarkPalette(isDark: boolean) {
    this.paletteToggle = isDark;
    this.toggleDarkPalette(isDark);
  }
  toggleChange(event: CustomEvent) {
    this.toggleDarkPalette(event.detail.checked);
  }

  toggleDarkPalette(shouldAdd: boolean) {
    document.documentElement.classList.toggle('ion-palette-dark', shouldAdd);
  }
  loadSavedSettings() {
    const savedTheme = localStorage.getItem('darkMode');
    const savedAutoSync = localStorage.getItem('autoSync');

    if (savedTheme) {
      const themeSetting = this.appSettings.find(s => s.id === 'theme');
      if (themeSetting) {
        themeSetting.value = savedTheme === 'true';

        // Apply saved theme using Ionic's native dark mode
        document.body.classList.toggle('dark', themeSetting.value);
      }
    }

    if (savedAutoSync) {
      const autoSyncSetting = this.appSettings.find(s => s.id === 'autoSync');
      if (autoSyncSetting) {
        autoSyncSetting.value = savedAutoSync === 'true';
      }
    }
  }

  onSettingClick(setting: SettingItem) {
    if (setting.type === 'toggle') {
      if (setting.action) {
        setting.action();
      }
    } else if (setting.type === 'link' && setting.route) {
      this.router.navigate([setting.route]);
    } else if (setting.type === 'button' && setting.action) {
      setting.action();
    }
  }

  toggleTheme() {
    const themeSetting = this.appSettings.find(s => s.id === 'theme');
    if (themeSetting) {
      themeSetting.value = !themeSetting.value;
      localStorage.setItem('darkMode', themeSetting.value.toString());

      // Use Ionic's native dark mode
      document.body.classList.toggle('dark', themeSetting.value);

      this.showSuccessAlert(`Dark mode ${themeSetting.value ? 'enabled' : 'disabled'}`);
    }
  }

  toggleAutoSync() {
    const autoSyncSetting = this.appSettings.find(s => s.id === 'autoSync');
    if (autoSyncSetting) {
      autoSyncSetting.value = !autoSyncSetting.value;
      localStorage.setItem('autoSync', autoSyncSetting.value.toString());
      this.showSuccessAlert(`Auto sync ${autoSyncSetting.value ? 'enabled' : 'disabled'}`);
    }
  }

  sendFeedback() {
    // Open email client or feedback form
    const subject = encodeURIComponent('Gahvareh App Feedback');
    const body = encodeURIComponent('Hi Gahvareh team,\n\nI would like to share the following feedback:\n\n');
    window.open(`mailto:support@gahvareh.com?subject=${subject}&body=${body}`);
  }

  exportData() {
    this.showSuccessAlert('Data export started. You will receive an email when ready.');
    // Simulate data export
    setTimeout(() => {
      this.showSuccessAlert('Your data has been exported and sent to your email.');
    }, 2000);
  }

  deleteAccount() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      this.showErrorAlert('Account deletion requested. Please contact support for confirmation.');
    }
  }

  goBack() {
    this.router.navigate(['/tabs']);
  }

  logout() {
    if (confirm('Are you sure you want to sign out?')) {
      // Clear user data and navigate to login
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      this.router.navigate(['/welcome']);
    }
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
