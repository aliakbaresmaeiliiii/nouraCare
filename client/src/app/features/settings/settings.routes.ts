import { Routes } from '@angular/router';

export const SETTINGS_ROUTES: Routes = [
  {
    path: 'check-version',
    loadComponent: () =>
      import('@app/features/settings/check-version/check-version.component').then(
        (m) => m.CheckVersionComponent,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('@app/features/settings/settings.component').then((m) => m.SettingsComponent),
  },
  {
    path: 'privacy-settings',
    loadComponent: () =>
      import('@app/features/settings/privacy-settings/privacy-settings.component').then(
        (m) => m.PrivacySettingsComponent,
      ),
  },
  {
    path: 'data-usage',
    loadComponent: () =>
      import('@app/features/settings/data-usage/data-usage.component').then(
        (m) => m.DataUsageComponent,
      ),
  },
  {
    path: 'help-support',
    loadComponent: () =>
      import('@app/features/settings/settings-help/settings-help.component').then(
        (m) => m.SettingsHelpComponent,
      ),
  },
  {
    path: 'privacy-policy',
    loadComponent: () =>
      import('@app/features/settings/settings-legal-page/settings-legal-page.component').then(
        (m) => m.SettingsLegalPageComponent,
      ),
    data: {
      titleKey: 'settings.privacyPolicy.title',
      subtitleKey: 'settings.privacyPolicy.subtitle',
      bodyKey: 'settings.privacyPolicy.body',
      showEffectiveDate: true,
      heroIcon: 'shield-checkmark',
      documentType: 'privacy',
      contactEmail: 'support@dorehealth.app',
      contactTextKey: 'settings.legal.privacyContactText',
    },
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('@app/features/settings/settings-legal-page/settings-legal-page.component').then(
        (m) => m.SettingsLegalPageComponent,
      ),
    data: {
      titleKey: 'settings.terms.title',
      subtitleKey: 'settings.terms.subtitle',
      bodyKey: 'settings.terms.body',
      showEffectiveDate: true,
      heroIcon: 'document-text',
      documentType: 'terms',
      contactEmail: 'support@dorehealth.app',
      contactTextKey: 'settings.legal.termsContactText',
    },
  },
];
