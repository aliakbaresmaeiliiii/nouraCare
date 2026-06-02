import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  PrivacySettings,
  PrivacySettingsService,
} from '../../shared/services/privacy-settings.service';
import { TranslationService } from '../../shared/services/translation.service';
import { SHARED_STANDALONE_IMPORTS } from '../../shared/shared-standalone';

@Component({
  selector: 'app-privacy-settings',
  templateUrl: './privacy-settings.component.html',
  styleUrls: ['./privacy-settings.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class PrivacySettingsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly privacySettings = inject(PrivacySettingsService);
  private readonly translation = inject(TranslationService);

  settings: PrivacySettings = this.privacySettings.getSettings();

  ngOnInit(): void {
    this.settings = this.privacySettings.getSettings();
  }

  onToggleChange(key: keyof PrivacySettings, checked: boolean): void {
    this.settings = this.privacySettings.updateSettings({ [key]: checked });
  }

  goBack(): void {
    void this.router.navigate(['/settings']);
  }

  t(key: string): string {
    return this.translation.translate(key);
  }
}
