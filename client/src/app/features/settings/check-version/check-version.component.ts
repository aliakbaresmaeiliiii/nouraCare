import { Component, OnInit, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowUpCircleOutline,
  checkmarkCircleOutline,
  downloadOutline,
  phonePortraitOutline,
  refreshOutline,
  starOutline,
  timeOutline,
} from 'ionicons/icons';
import type { RefresherCustomEvent } from '@ionic/core';
import { ToastController } from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { TranslationService } from '@app/shared/services/translation.service';
import { LanguageService } from '@app/shared/services/language.service';
import { PwaPlatformService } from '@app/shared/services/pwa-platform.service';
import { environment } from '@environments/environment';

interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  releaseDate: string;
  releaseNotes: string[];
  isUpdateAvailable: boolean;
  downloadUrl?: string;
}

@Component({
  selector: 'app-check-version',
  templateUrl: './check-version.component.html',
  styleUrls: ['./check-version.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class CheckVersionComponent implements OnInit {
  private readonly toastController = inject(ToastController);
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly pwaPlatform = inject(PwaPlatformService);

  isLoading = false;
  errorMessage = '';
  versionInfo: VersionInfo | null = null;
  lastChecked = '';
  releasedLabel = '';
  lastCheckedLabel = '';

  constructor() {
    addIcons({
      alertCircleOutline,
      arrowUpCircleOutline,
      checkmarkCircleOutline,
      downloadOutline,
      phonePortraitOutline,
      refreshOutline,
      starOutline,
      timeOutline,
    });
  }

  ngOnInit(): void {
    this.languageService.currentLanguage$.subscribe(() => this.refreshLabels());
    void this.loadVersionInfo();
  }

  private refreshLabels(): void {
    if (this.versionInfo?.releaseDate) {
      this.releasedLabel = this.translation.translateParams('checkVersion.released', {
        date: this.formatDate(this.versionInfo.releaseDate),
      });
    }
    if (this.lastChecked) {
      this.lastCheckedLabel = this.translation.translateParams('checkVersion.lastChecked', {
        time: this.lastChecked,
      });
    }
  }

  async loadVersionInfo(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await new Promise((r) => setTimeout(r, 500));
      this.versionInfo = {
        currentVersion: '1.0.0',
        latestVersion: '1.2.0',
        releaseDate: '2024-01-20T10:00:00Z',
        releaseNotes: [
          'Improved health tracking and reminders',
          'Clearer home screen and insights',
          'Bug fixes for profile completion',
          'More language options',
          'Security and stability improvements',
        ],
        isUpdateAvailable: true,
        downloadUrl:
          'https://play.google.com/store/apps/details?id=com.tecknnycs.dorehealth',
      };
      this.lastChecked = new Date().toLocaleString();
      this.refreshLabels();
    } catch {
      this.errorMessage = this.translation.translate('editProfile.saveFailed');
      this.versionInfo = null;
    } finally {
      this.isLoading = false;
    }
  }

  onRefresh(event: RefresherCustomEvent): void {
    void this.loadVersionInfo().finally(() => event.detail.complete());
  }

  async downloadUpdate(): Promise<void> {
    if (this.pwaPlatform.isIosSafari() || this.pwaPlatform.isStandalone()) {
      await this.showToast(this.translation.translate('pwa.installHint'));
      return;
    }

    const url = this.versionInfo?.downloadUrl ?? environment.pwaInstallUrl;
    if (!url) {
      await this.showToast(this.translation.translate('checkVersion.toast.noDownloadLink'));
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    await this.showToast(this.translation.translate('checkVersion.toast.storeOpened'));
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) {
        return 'Unknown date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Unknown date';
    }
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom',
    });
    await toast.present();
  }
}
