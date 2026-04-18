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
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

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

  isLoading = false;
  errorMessage = '';
  versionInfo: VersionInfo | null = null;
  lastChecked = '';

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
    void this.loadVersionInfo();
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
          'https://play.google.com/store/apps/details?id=com.tecknnycs.nouracare',
      };
      this.lastChecked = new Date().toLocaleString();
    } catch {
      this.errorMessage =
        'We could not reach the update service. Check your connection and try again.';
      this.versionInfo = null;
    } finally {
      this.isLoading = false;
    }
  }

  onRefresh(event: RefresherCustomEvent): void {
    void this.loadVersionInfo().finally(() => event.detail.complete());
  }

  async downloadUpdate(): Promise<void> {
    const url = this.versionInfo?.downloadUrl;
    if (!url) {
      await this.showToast('No download link is configured yet.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    await this.showToast('Opened the store in a new tab.');
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
