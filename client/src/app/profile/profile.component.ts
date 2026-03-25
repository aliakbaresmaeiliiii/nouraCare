import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ViewWillEnter } from '@ionic/angular';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { Router } from '@angular/router';
import { User } from '../shared/services/user';
import { ImageUrlService } from '../shared/services/image-url.service';
import { ProfileCompletionService } from '../shared/services/profile-completion.service';
import {
  ReproductiveStatusService,
  ReproductiveStatusData,
} from '../shared/services/reproductive-status.service';
import { PregnancyEndDialogComponent } from '../shared/components/pregnancy-end-dialog/pregnancy-end-dialog.component';
import { ModalController } from '@ionic/angular/standalone';
import { Share } from '@capacitor/share';
import { HomeDataService } from '../home/services/home-data.service';
import { UserSessionService } from '../shared/services/user-session.service';

// Extend Window interface to include Capacitor
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform(): boolean;
    };
  }
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  imports: [...SHARED_STANDALONE_IMPORTS],
  styleUrls: ['./profile.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileComponent implements OnInit, ViewWillEnter {
  // Use the service's computed signal for percent
  get percent(): number {
    const completion = this.profileCompletionService.profileCompletion();
    return completion;
  }

  // Getter methods for field completion status
  get isNameCompleted(): boolean {
    return this.profileCompletionService.isNameCompleted;
  }

  get isEmailCompleted(): boolean {
    return this.profileCompletionService.isEmailCompleted;
  }

  get isBirthdayCompleted(): boolean {
    return this.profileCompletionService.isBirthdayCompleted;
  }

  get currentUserData(): any {
    return this.profileCompletionService.currentUserData;
  }

  selectedTab = 'first';
  // swiperEl = viewChild('swiperContainer');
  router = inject(Router);
  userInfoStore: any = {};
  fullName: string = '';
  email: string = '';
  birthday: string = '';
  city: string = '';
  profileImage: string | null = null;
  private userService = inject(User);
  private homeService = inject(HomeDataService);
  private userSession = inject(UserSessionService);
  private imageUrlService = inject(ImageUrlService);
  public profileCompletionService = inject(ProfileCompletionService);
  private reproductiveStatusService = inject(ReproductiveStatusService);
  private modalCtrl = inject(ModalController);
  private cdr = inject(ChangeDetectorRef);
  userId = 0;

  /**
   * Avatar img src — updated when GET /user returns. Stored as a field so change detection
   * refreshes the image (a getter reading only the service signal can fail to update the view).
   */
  avatarImageSrc = this.imageUrlService.getImageUrl(null);

  // Reproductive status data
  reproductiveStatus: ReproductiveStatusData = {};
  cycleLengthOptions = [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
  lastPeriodDate: string = '';
  selectedCycleLength: number = 28;

  userInfo = signal<any[]>([
    {
      friends: 20,
      Question: 50,
      Answers: 30,
      Benefits: 40,
    },
  ]);

  isShowBtn = false;
  title = '';
  currentSlide: number = 1;
  dotHelper: Array<Number> = [];

  // @ViewChild('sliderRef') sliderRef!: ElementRef<HTMLElement>;

  segmentChanged(ev: any) {
    this.selectedTab = ev.detail.value;
  }

  someFunction() {}

  editProfile() {
    // Logic to edit profile
    this.router.navigate(['/edit-profile']);
  }

  // Reproductive status methods
  async loadReproductiveStatus() {
    try {
      this.reproductiveStatusService
        .getReproductiveStatus(this.userId)
        .subscribe({
          next: (data) => {
            this.reproductiveStatus = data;
            if (data.lastPeriodDate) {
              this.lastPeriodDate = data.lastPeriodDate;
            }
            if (data.cycleLength) {
              this.selectedCycleLength = data.cycleLength;
            }
          },
          error: (error: any) => {
            // Backend intentionally returns 404 because pregnancy planning
            // was replaced with HealthRecord. Treat this as non-fatal.
            const message =
              error?.message ||
              error?.error?.message ||
              error?.error?.error?.message ||
              '';
            const isReplacedFeature404 =
              (error?.status === 404 ||
                error?.error?.status === 404 ||
                error?.error?.error?.statusCode === 404) &&
              typeof message === 'string' &&
              message
                .toLowerCase()
                .includes('pregnancy planning feature has been replaced');

            if (isReplacedFeature404) {
              this.reproductiveStatus = {};
              this.lastPeriodDate = '';
              this.selectedCycleLength = 28;
              return;
            }

            console.error('Error loading reproductive status:', error);
          },
        });
    } catch (error) {
      console.error('Error loading reproductive status:', error);
    }
  }

  async openPregnancyEndDialog() {
    const modal = await this.modalCtrl.create({
      component: PregnancyEndDialogComponent,
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();

    if (data && data.pregnancyEndDate) {
      // Auto-set isPregnant to false when pregnancyEndDate is provided
      const updateData = {
        isPregnant: false,
        pregnancyEndDate: data.pregnancyEndDate,
        notes: data.notes,
      };

      this.updateReproductiveStatus(updateData);
    }
  }

  updateReproductiveStatus(data: ReproductiveStatusData) {
    const userId = this.userInfoStore?.user?.id;
    if (!userId) {
      console.error('User ID not found');
      this.showToast('Error: User ID not found');
      return;
    }

    this.reproductiveStatusService
      .updateReproductiveStatus(userId, data)
      .subscribe({
        next: (response) => {
          console.log('Reproductive status updated successfully:', response);
          this.loadReproductiveStatus(); // Refresh data
          this.showToast('Status updated successfully!');
        },
        error: (error) => {
          console.error('Error updating reproductive status:', error);
          this.showToast('Error updating status. Please try again.');
        },
      });
  }

  submitPeriodTracking() {
    if (!this.lastPeriodDate) {
      this.showToast('Please select your last period date');
      return;
    }

    const updateData: ReproductiveStatusData = {
      lastPeriodDate: this.lastPeriodDate,
      cycleLength: this.selectedCycleLength,
      isPregnant: false, // Ensure pregnancy status is false when tracking periods
    };

    this.updateReproductiveStatus(updateData);
  }

  goToCycleCalendar() {
    this.router.navigate(['/cycle-calendar']);
  }

  getTodayDate(): string {
    return new Date().toISOString();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getPregnancyWeek(): number {
    if (!this.reproductiveStatus.lastPeriodDate) return 0;

    const lastPeriod = new Date(this.reproductiveStatus.lastPeriodDate);
    const today = new Date();
    const diffTime = today.getTime() - lastPeriod.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.floor(diffDays / 7);
  }

  private showToast(message: string) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--ion-color-dark);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      text-align: center;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 3000);
  }

  goEdit(field: string) {
    this.router.navigate(['/edit-profile'], { queryParams: { focus: field } });
  }

  goToPregnancyPlanning() {
    this.router.navigate(['/pregnancy-planning']);
  }

  async shareProfile() {
    try {
      // Create share data
      const shareData = {
        title: 'My Profile - Gahvareh',
        text: `Check out my profile on Gahvareh! I'm ${
          this.fullName || 'a user'
        } and my profile is ${this.percent}% complete.`,
        url: window.location.href,
      };

      // Try Web Share API first (works on mobile browsers)
      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch (error) {
          console.log('Web Share API failed:', error);
        }
      }

      // Try Capacitor Share plugin (for native apps)
      try {
        await Share.share(shareData);
        return;
      } catch (error) {
        console.log('Capacitor Share failed:', error);
      }

      // Fallback: Copy to clipboard
      const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
      await this.copyToClipboard(shareText);
      this.showShareSuccessAlert();
    } catch (error) {
      console.error('Error sharing profile:', error);
      // Final fallback: Copy to clipboard
      try {
        const fallbackText = `My Profile - Gahvareh\nCheck out my profile: ${window.location.href}`;
        await this.copyToClipboard(fallbackText);
        this.showShareSuccessAlert();
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
        this.showShareErrorAlert();
      }
    }
  }

  private async copyToClipboard(text: string): Promise<void> {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  private showShareSuccessAlert() {
    const alert = document.createElement('div');
    alert.style.cssText = `
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

    alert.innerHTML = `✅ Profile link copied to clipboard!`;
    document.body.appendChild(alert);

    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 3000);
  }

  private showShareErrorAlert() {
    const alert = document.createElement('div');
    alert.style.cssText = `
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

    alert.innerHTML = `❌ Failed to share profile. Please try again.`;
    document.body.appendChild(alert);

    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 3000);
  }

  private showShareNotSupportedAlert() {
    const alert = document.createElement('div');
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff9800;
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

    alert.innerHTML = `📱 Share feature works best on mobile devices. Link copied to clipboard!`;
    document.body.appendChild(alert);

    // Also copy to clipboard
    const shareText = `My Profile - Gahvareh\nCheck out my profile: ${window.location.href}`;
    this.copyToClipboard(shareText);

    setTimeout(() => {
      if (alert.parentNode) {
        alert.remove();
      }
    }, 4000);
  }

  /**
   * Optimistic labels from localStorage only — do not set avatar here; that was overwriting
   * the real URL after GET /user when ionViewWillEnter ran with empty stored profileImage.
   */
  refreshProfileData() {
    try {
      this.userInfoStore = this.userSession.getUserInfoStoreOrEmpty();
      const u = this.userInfoStore?.user || {};
      this.fullName = u.fullName || u.name || this.fullName;
      this.email = u.email || this.email;
      this.birthday = u.birthday || this.birthday;
      this.city = u.city || this.city;
    } catch {}
  }

  private applyProfileFromMerged(merged: any): void {
    this.fullName = merged.fullName || this.fullName;
    this.email = merged.email || this.email;
    this.birthday = merged.birthday || this.birthday;
    this.city = merged.city ?? this.city;
    this.profileImage = merged.profileImage;
    this.avatarImageSrc = merged.profileImage;
    try {
      this.userInfoStore = this.userSession.getUserInfoStoreOrEmpty();
      if (this.userInfoStore?.user) {
        this.userInfoStore.user = {
          ...this.userInfoStore.user,
          ...merged,
        };
      }
    } catch {
      /* ignore */
    }
    this.cdr.markForCheck();
  }

  onAvatarImgError(): void {
    this.avatarImageSrc = this.imageUrlService.getImageUrl(null);
    this.cdr.markForCheck();
  }

  ionViewWillEnter(): void {
    this.refreshProfileData();
    this.profileCompletionService.refreshFromAPI().subscribe({
      next: (merged) => {
        if (merged) {
          this.applyProfileFromMerged(merged);
        }
      },
    });
  }

  ngOnInit(): void {
    this.userId = this.homeService.getCurrentUserId();
    this.loadReproductiveStatus();

    try {
      this.userInfoStore = this.userSession.getUserInfoStoreOrEmpty();
      const u = this.userInfoStore?.user || {};
      this.fullName = u.fullName || u.name || '';
      this.email = u.email || '';
      this.birthday = u.birthday || '';
      this.city = u.city || '';
      const quick = this.imageUrlService.getImageUrl(
        u.profileImage ?? u.profile_img ?? null,
      );
      this.profileImage = quick;
      this.avatarImageSrc = quick;
    } catch (error) {
      console.error(
        'ProfileComponent - Error loading from localStorage:',
        error,
      );
    }
  }
}
