import { Component, OnInit, inject } from '@angular/core';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { Router } from '@angular/router';

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
})
export class CheckVersionComponent implements OnInit {
  private router = inject(Router);
  
  isLoading = false;
  errorMessage = '';
  versionInfo: VersionInfo | null = null;
  lastChecked: string = '';

  constructor() { }

  ngOnInit() {
    this.loadVersionInfo();
  }

  loadVersionInfo() {
    this.isLoading = true;
    this.errorMessage = '';
    
    // TODO: Replace with actual API call when backend is ready
    // this.versionService.checkForUpdates().subscribe({
    //   next: (response: any) => {
    //     this.versionInfo = response;
    //     this.lastChecked = new Date().toLocaleString();
    //     this.isLoading = false;
    //   },
    //   error: (error: any) => {
    //     console.error('Error checking for updates:', error);
    //     this.errorMessage = 'Failed to check for updates. Please try again.';
    //     this.isLoading = false;
    //   }
    // });

    // Mock data for now
    setTimeout(() => {
      this.versionInfo = {
        currentVersion: '1.0.0',
        latestVersion: '1.2.0',
        releaseDate: '2024-01-20T10:00:00Z',
        releaseNotes: [
          'Added new health tracking features',
          'Improved user interface design',
          'Fixed bug in profile completion calculation',
          'Added support for multiple languages',
          'Enhanced security features'
        ],
        isUpdateAvailable: true,
        downloadUrl: 'https://play.google.com/store/apps/details?id=com.tecknnycs.nouracare'
      };
      this.lastChecked = new Date().toLocaleString();
      this.isLoading = false;
    }, 1500);
  }

  downloadUpdate() {
    if (this.versionInfo?.downloadUrl) {
      window.open(this.versionInfo.downloadUrl, '_blank');
    }
  }

  goBack() {
    this.router.navigate(['/tabs']);
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown date';
    }
  }

  private showSuccessAlert(message: string): void {
    const successDialog = document.createElement('div');
    successDialog.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    const messageElement = document.createElement('div');
    messageElement.innerHTML = `✅ ${message}`;
    messageElement.style.cssText = `
      font-size: 14px;
      font-weight: 500;
    `;

    successDialog.appendChild(messageElement);
    document.body.appendChild(successDialog);

    setTimeout(() => {
      if (successDialog.parentNode) {
        successDialog.remove();
      }
    }, 3000);
  }

  private showErrorAlert(message: string): void {
    const errorDialog = document.createElement('div');
    errorDialog.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #f44336;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    const messageElement = document.createElement('div');
    messageElement.innerHTML = `❌ ${message}`;
    messageElement.style.cssText = `
      font-size: 14px;
      font-weight: 500;
    `;

    errorDialog.appendChild(messageElement);
    document.body.appendChild(errorDialog);

    setTimeout(() => {
      if (errorDialog.parentNode) {
        errorDialog.remove();
      }
    }, 5000);
  }
}
