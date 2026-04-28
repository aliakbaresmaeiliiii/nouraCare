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
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../shared/services/user';
import { ImageUrlService } from '../shared/services/image-url.service';
import { ProfileCompletionService } from '../shared/services/profile-completion.service';
import {
  ReproductiveStatusService,
  ReproductiveStatusData,
} from '../shared/services/reproductive-status.service';
import { PregnancyEndDialogComponent } from '../shared/components/pregnancy-end-dialog/pregnancy-end-dialog.component';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import { Share } from '@capacitor/share';
import { HomeDataService } from '../home/services/home-data.service';
import { UserSessionService } from '../shared/services/user-session.service';
import {
  OnboardingService,
  ReproductiveState,
} from '../shared/services/onboarding.service';

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
  host: { class: 'ion-page' },
})
export class ProfileComponent implements OnInit, ViewWillEnter {
  currentReproductiveStatus: string | null = null;
  get isExperienceLoading(): boolean {
    return this.profileCompletionService.loading;
  }
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

  get isDateOfBirthCompleted(): boolean {
    return this.profileCompletionService.currentUserData?.dateOfBirth ? true : false;
  }

  get currentUserData(): any {
    return this.profileCompletionService.currentUserData;
  }

  formatDateOnly(value: unknown): string {
    const s = String(value ?? '').trim();
    if (!s || s === 'null' || s === 'undefined') return '';

    const normalized = s.replace(/^["']|["']$/g, '');
    if (!normalized) return '';

    // Handle ISO strings like: 2026-03-17T07:42:00.000Z
    const isoDateMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoDateMatch?.[1]) return isoDateMatch[1];
    // Fallback: attempt parsing.
    const d = new Date(normalized);
    if (Number.isNaN(d.getTime())) return s;
    return d.toISOString().slice(0, 10);
  }

  selectedTab = 'first';
  // swiperEl = viewChild('swiperContainer');
  router = inject(Router);
  private route = inject(ActivatedRoute);
  userInfoStore: any = {};
  fullName: string = '';
  email: string = '';
  dateOfBirth: string = '';
  city: string = '';
  profileImage: string | null = null;
  private userService = inject(User);
  private homeService = inject(HomeDataService);
  private userSession = inject(UserSessionService);
  private imageUrlService = inject(ImageUrlService);
  public profileCompletionService = inject(ProfileCompletionService);
  private reproductiveStatusService = inject(ReproductiveStatusService);
  private onboardingService = inject(OnboardingService);
  private modalCtrl = inject(ModalController);
  private alertController = inject(AlertController);
  private cdr = inject(ChangeDetectorRef);
  userId = 0;

  /**
   * Avatar img src — updated when GET /user returns. Stored as a field so change detection
   * refreshes the image (a getter reading only the service signal can fail to update the view).
   */
  avatarImageSrc = this.imageUrlService.getImageUrl(null);
  avatarImgLoaded = true;
  avatarSkeletonActive = false;
  private lastAvatarImageSrc = this.avatarImageSrc;
  isUploadingAvatar = false;

  onAvatarImgLoad(): void {
    this.avatarImgLoaded = true;
    this.avatarSkeletonActive = false;
    this.cdr.markForCheck();
  }

  openAvatarPicker(): void {
    if (this.isUploadingAvatar) return;
    const input = document.getElementById('profileAvatarInput') as HTMLInputElement | null;
    input?.click();
  }

  onAvatarFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size should be less than 5MB.');
      input.value = '';
      return;
    }

    const id =
      this.userInfoStore?.user?.id ??
      this.userInfoStore?.data?.id ??
      this.userSession.getCurrentUserId();
    if (!id) {
      alert('User not found. Please sign in again.');
      input.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    this.isUploadingAvatar = true;
    this.avatarImgLoaded = false;
    this.avatarSkeletonActive = true;
    this.avatarImageSrc = previewUrl;
    this.cdr.markForCheck();

    this.userService.uploadProfileImage(String(id), file).subscribe({
      next: (res: any) => {
        URL.revokeObjectURL(previewUrl);
        const serverUrl = this.imageUrlService.getImageUrl(res.url);
        this.avatarImageSrc = serverUrl;
        this.profileImage = serverUrl;
        this.lastAvatarImageSrc = serverUrl;
        this.avatarImgLoaded = true;
        this.avatarSkeletonActive = false;
        this.isUploadingAvatar = false;
        try {
          this.userSession.mergeIntoStoredUser({ profileImage: res.url });
        } catch {
          // Non-blocking: server succeeded even if local merge fails.
        }
        input.value = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error uploading profile image from profile page:', err);
        URL.revokeObjectURL(previewUrl);
        this.avatarImageSrc = this.lastAvatarImageSrc || this.imageUrlService.getImageUrl(null);
        this.avatarImgLoaded = true;
        this.avatarSkeletonActive = false;
        this.isUploadingAvatar = false;
        input.value = '';
        alert('Failed to upload image. Please try again.');
        this.cdr.markForCheck();
      },
    });
  }

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

  setStatus(statusValue: string | null): void {
    this.currentReproductiveStatus = statusValue;
    this.cdr.markForCheck();
  }

  isStatusSelected(statusValue: string): boolean {
    return this.currentReproductiveStatus === statusValue;
  }

  getCurrentStatus(): string | null {
    return this.currentReproductiveStatus;
  }

  async openGetPregnantIntro(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Get pregnant',
      message:
        'You are going to switch to pregnancy tracking mode. Do you want to continue?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Yes',
          role: 'confirm',
        },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') {
      return;
    }

    this.currentReproductiveStatus = 'PLANNING_PREGNANCY';
    await this.router.navigate(['/track-pregnancy-intro']);
  }

  async openTrackPregnancyIntro(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Track pregnancy',
      message: 'Are you sure you want to continue to pregnancy tracking?',
      buttons: [
        {
          text: 'No',
          role: 'cancel',
        },
        {
          text: 'Yes',
          role: 'confirm',
        },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') {
      return;
    }

    this.currentReproductiveStatus = 'PREGNANT';
    await this.router.navigate(['/track-pregnancy-intro']);
  }

  onTrackCycleCardClick(): void {
    if (this.isStatusSelected('NOT_PREGNANT')) {
      return;
    }
    this.goToCycleCalendar();
  }

  onTrackPlanningCardClick(): void {
    if (this.isStatusSelected('PLANNING_PREGNANCY')) {
      return;
    }
    void this.openGetPregnantIntro();
  }

  onTrackPregnancyCardClick(): void {
    if (this.isStatusSelected('PREGNANT')) {
      return;
    }
    void this.openTrackPregnancyIntro();
  }

  async onSubmit(_source: 'continue' | 'save' = 'continue'): Promise<void> {
    const selected = this.getCurrentStatus();
    if (!selected) return;
    if (selected === 'PLANNING_PREGNANCY') {
      await this.openGetPregnantIntro();
      return;
    }

    const state = this.mapUiReproductiveToApiPregnancyStatus(selected);
    if (!state) return;
    this.onboardingService.updateReproductiveState({ state }).subscribe({
      next: () => {
        this.showToast('Reproductive status updated successfully!');
        this.profileCompletionService.refreshFromAPI().subscribe({
          next: () => this.syncCurrentStatusFromProfileData(),
        });
        if (selected === 'NOT_PREGNANT') {
          this.goToCycleCalendar();
          return;
        }
        if (selected === 'PLANNING_PREGNANCY') {
          this.goToPregnancyPlanning();
        }
      },
      error: () => this.showToast('Failed to update reproductive status.'),
    });
  }

  private mapUiReproductiveToApiPregnancyStatus(
    ui: string | null | undefined,
  ): ReproductiveState | null {
    if (!ui) return null;
    if (ui === 'NOT_PREGNANT') return 'cycle';
    if (ui === 'PLANNING_PREGNANCY') return 'planning';
    if (ui === 'PREGNANT') return 'pregnant';
    return null;
  }

  private syncCurrentStatusFromProfileData(): void {
    const status = this.profileCompletionService.currentUserData?.status;
    this.currentReproductiveStatus =
      typeof status === 'string' && status.trim() ? status : null;
  }

  // // Reproductive status methods
  // async loadReproductiveStatus() {
  //   try {
  //     this.reproductiveStatusService
  //       .getReproductiveStatus(this.userId)
  //       .subscribe({
  //         next: (data) => {
  //           this.reproductiveStatus = data;
  //           if (data.lastPeriodDate) {
  //             this.lastPeriodDate = data.lastPeriodDate;
  //           }
  //           if (data.cycleLength) {
  //             this.selectedCycleLength = data.cycleLength;
  //           }
  //         },
  //         error: (error: any) => {
  //           // Backend intentionally returns 404 because pregnancy planning
  //           // was replaced with HealthRecord. Treat this as non-fatal.
  //           const message =
  //             error?.message ||
  //             error?.error?.message ||
  //             error?.error?.error?.message ||
  //             '';
  //           const isReplacedFeature404 =
  //             (error?.status === 404 ||
  //               error?.error?.status === 404 ||
  //               error?.error?.error?.statusCode === 404) &&
  //             typeof message === 'string' &&
  //             message
  //               .toLowerCase()
  //               .includes('pregnancy planning feature has been replaced');

  //           if (isReplacedFeature404) {
  //             this.reproductiveStatus = {};
  //             this.lastPeriodDate = '';
  //             this.selectedCycleLength = 28;
  //             return;
  //           }

  //           console.error('Error loading reproductive status:', error);
  //         },
  //       });
  //   } catch (error) {
  //     console.error('Error loading reproductive status:', error);
  //   }
  // }

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
          // this.loadReproductiveStatus(); // Refresh data
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
    this.router.navigate(['/pregnancy-mode']);
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
        title: 'My Profile - NouraCare',
        text: `Check out my profile on NouraCare! I'm ${
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
        const fallbackText = `My Profile - NouraCare\nCheck out my profile: ${window.location.href}`;
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

    alert.textContent = '✅ Profile link copied to clipboard!';
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
      background: #c21e56;
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

    alert.textContent = '❌ Failed to share profile. Please try again.';
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

    alert.textContent =
      '📱 Share feature works best on mobile devices. Link copied to clipboard!';
    document.body.appendChild(alert);

    // Also copy to clipboard
    const shareText = `My Profile - NouraCare\nCheck out my profile: ${window.location.href}`;
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
      this.dateOfBirth = u.dateOfBirth || this.dateOfBirth;
      this.city = u.city || this.city;
    } catch {}
  }

  private applyProfileFromMerged(merged: any): void {
    this.fullName = merged.fullName || this.fullName;
    this.email = merged.email || this.email;
    this.dateOfBirth = merged.dateOfBirth || this.dateOfBirth;
    this.city = merged.city ?? this.city;
    this.profileImage = merged.profileImage;
    const nextAvatarSrc = merged.profileImage;
    if (nextAvatarSrc && nextAvatarSrc !== this.lastAvatarImageSrc) {
      // Show skeleton only while avatar is being replaced after edit-profile.
      this.avatarImgLoaded = false;
      this.avatarSkeletonActive = true;
    } else {
      this.avatarImgLoaded = true;
      this.avatarSkeletonActive = false;
    }
    this.lastAvatarImageSrc = nextAvatarSrc;
    this.avatarImageSrc = nextAvatarSrc;
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
    this.avatarImgLoaded = true;
    this.avatarSkeletonActive = false;
    this.cdr.markForCheck();
  }

  ionViewWillEnter(): void {
    this.refreshProfileData();
    this.profileCompletionService.refreshFromAPI().subscribe({
      next: (merged) => {
        if (merged) {
          this.applyProfileFromMerged(merged);
        }
        this.syncCurrentStatusFromProfileData();
        this.applyStatusFromQuery();
      },
    });
  }

  ngOnInit(): void {
    this.userId = this.homeService.getCurrentUserId();
    // this.loadReproductiveStatus();

    try {
      this.userInfoStore = this.userSession.getUserInfoStoreOrEmpty();
      const u = this.userInfoStore?.user || {};
      this.fullName = u.fullName || u.name || '';
      this.email = u.email || '';
      this.dateOfBirth = u.dateOfBirth || '';
      this.city = u.city || '';
      const quick = this.imageUrlService.getImageUrl(
        u.profileImage ?? u.profile_img ?? null,
      );
      this.profileImage = quick;
      this.avatarImageSrc = quick;
      this.lastAvatarImageSrc = quick;
      this.avatarImgLoaded = true;
      this.avatarSkeletonActive = false;
      this.syncCurrentStatusFromProfileData();
      this.applyStatusFromQuery();
    } catch (error) {
      console.error(
        'ProfileComponent - Error loading from localStorage:',
        error,
      );
    }
  }

  private applyStatusFromQuery(): void {
    const selectedFromQuery = this.route.snapshot.queryParamMap.get('selectStatus');
    if (selectedFromQuery === 'PREGNANT') {
      this.currentReproductiveStatus = 'PREGNANT';
      this.cdr.markForCheck();
    }
  }
}
