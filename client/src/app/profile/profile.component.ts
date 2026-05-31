import {
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Share } from '@capacitor/share';
import { ToastController, ViewWillEnter } from '@ionic/angular';
import { AlertController, ModalController } from '@ionic/angular/standalone';
import { HomeDataService } from '../home/services/home-data.service';
import { PregnancyEndDialogComponent } from '../shared/components/pregnancy-end-dialog/pregnancy-end-dialog.component';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import { ImageUrlService } from '../shared/services/image-url.service';
import {
  OnboardingService,
  ReproductiveStatus,
} from '../shared/services/onboarding.service';
import { ProfileCompletionService } from '../shared/services/profile-completion.service';
import {
  ReproductiveStatusData,
  ReproductiveStatusService,
} from '../shared/services/reproductive-status.service';
import { User } from '../shared/services/user';
import { UserInfoService } from '../shared/services/user-info.service';
import { UserSessionService } from '../shared/services/user-session.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { ReproductiveStatusComponent } from './reproductive-status/reproductive-status.component';

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
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private modalCtrl = inject(ModalController);
  private reproductiveStatus = inject(ReproductiveStatusService);
  private userService = inject(User);
  readonly profileCompletion = inject(ProfileCompletionService);
  userId = signal<number>(0);
  private userSession = inject(UserSessionService);
  private onboardingService = inject(OnboardingService);
  private toastCtrl = inject(ToastController);
  userInfoStore: any = {};
  periodHistory = signal<any[]>([]);

  @ViewChild('profileAvatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  currentReproductiveStatus: string | null = null;
  selectedTab = 'first';

  isUploadingAvatar = false;
  avatarSrc = '';
  avatarSkeleton = false;
  userActivity = signal({
    friends: 20,
    questions: 50,
    answers: 30,
    benefits: 40,
  });

  // Define the fields structure
  readonly profileFields = [
    { key: 'name', label: 'Full Name', icon: 'person-outline' },
    { key: 'email', label: 'Email Address', icon: 'mail-outline' },
    { key: 'dateOfBirth', label: 'Date of Birth', icon: 'calendar-outline' },
  ];

  // Helper for the dynamic template
  isFieldCompleted(key: string): boolean {
    const data = this.profileCompletion.currentUserData;
    if (!data) return false;
    return !!data[key];
  }

  getFieldValue(key: string): string {
    const data = this.profileCompletion.currentUserData;
    return data?.[key] || '';
  }
  patchValueUser() {
    this.userInfoStore = this.userSession.getUserInfoStoreOrEmpty();
  }
  ngOnInit() {
    this.loadInitialProfile();
    this.patchValueUser();
    this.userId.set(this.userInfoStore?.user?.id);
    // this.getPeriodLogs();
  }

  getPeriodLogs() {
    // this.reproductiveStatus
    //   .getPeriodLogs(this.userId())
    //   .subscribe((res: any) => {
    //     this.periodHistory.set(res);
    //   });
  }

  private getLatestPeriodDate(entries: any[]): string | null {
    if (!entries || entries.length === 0) return null;
    debugger;
    // 1. Sort by date (descending: newest first)
    // 2. Pick the first one
    const latest = [...entries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return latest?.createdAt || null;
  }

  ionViewWillEnter() {
    this.refreshProfile();
  }

  // -----------------------------
  // PROFILE LOAD & SYNC
  // -----------------------------
  private loadInitialProfile() {
    const stored = this.userSession.getUserInfoStoreOrEmpty();
    this.applyProfile(stored?.user);
  }

  private refreshProfile() {
    this.profileCompletion.refreshFromAPI().subscribe({
      next: (merged) => {
        if (merged) this.applyProfile(merged);
        this.syncStatusFromApi();
      },
    });
  }

  private applyProfile(user: any) {
    if (!user) return;

    const image = user.profileImage ?? null;

    if (image !== this.avatarSrc) {
      this.avatarSkeleton = true;
      this.avatarSrc = image;
    }

    // Automatically stored by API service
    this.userSession.mergeIntoStoredUser(user);
  }

  // -----------------------------
  // AVATAR UPLOAD
  // -----------------------------
  openAvatarPicker() {
    if (this.isUploadingAvatar) return;
    this.avatarInput.nativeElement.click();
  }

  onAvatarFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.showToast('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('Image must be < 5MB');
      return;
    }

    this.uploadAvatar(file);
  }

  private uploadAvatar(file: File) {
    const id = this.userSession.getCurrentUserId();
    if (!id) {
      this.showToast('User not found, please sign in again.');
      return;
    }

    const preview = URL.createObjectURL(file);
    this.isUploadingAvatar = true;
    this.avatarSkeleton = true;
    this.avatarSrc = preview;

    this.userService.uploadProfileImage(String(id), file).subscribe({
      next: (res) => {
        URL.revokeObjectURL(preview);
        this.avatarSrc = res.url;
        this.avatarSkeleton = false;
        this.isUploadingAvatar = false;
        this.userSession.mergeIntoStoredUser({ profileImage: res.url });
      },
      error: () => {
        URL.revokeObjectURL(preview);
        this.showToast('Failed to upload image.');
        this.isUploadingAvatar = false;
        this.avatarSkeleton = false;
        this.refreshProfile();
      },
    });
  }

  onAvatarImgLoad() {
    this.avatarSkeleton = false;
  }

  onAvatarImgError() {
    this.avatarSrc = 'assets/default-avatar.png';
    this.avatarSkeleton = false;
  }

  // -----------------------------
  // REPRODUCTIVE STATUS
  // -----------------------------
  setStatus(s: string | null) {
    debugger;
    this.currentReproductiveStatus = s;
  }

  isStatusSelected(s: string) {
    return this.currentReproductiveStatus === s;
  }

  syncStatusFromApi() {
    const apiStatus = this.profileCompletion.currentUserData?.status;
    this.currentReproductiveStatus = this.normalizeStatus(apiStatus);
  }

  private normalizeStatus(s: string | null): string | null {
    if (!s) return 'NOT_PREGNANT';
    s = s.replace(/\s+/g, '_').toUpperCase();

    const map: any = {
      PREGNANT: 'PREGNANT',
      EXPECTING: 'PREGNANT',
      PLANNING_PREGNANCY: 'PLANNING_PREGNANCY',
      TRYING_TO_CONCEIVE: 'PLANNING_PREGNANCY',
      POSTPARTUM: 'POSTPARTUM',
      HAS_CHILD: 'POSTPARTUM',
      NOT_PREGNANT: 'NOT_PREGNANT',
      CYCLE: 'NOT_PREGNANT',
    };

    return map[s] ?? 'NOT_PREGNANT';
  }

  async changeReproductiveStatus(status: string) {
    if (this.isStatusSelected(status)) return;
    if (status === 'PREGNANT') {
      const modal = await this.modalCtrl.create({
        component: ReproductiveStatusComponent,
        componentProps: {
          title: 'Information Cycle Period',
          subTitle: 'Please put you',
        },
      });

      await modal.present();

      const { data, role } = await modal.onWillDismiss();
      debugger;

      if (role === 'confirm' && data) {
        const updateData = {
          isPregnant: false,
          pregnancyEndDate: data.pregnancyEndDate,
          notes: data.notes,
        };

        // this.updateReproductiveStatus(updateData);
        this.setStatus(status);
        this.onSubmit(updateData);
      }
    }
  }

  async onSubmit(data: ReproductiveStatusData) {
    debugger;
    const rawState = this.mapUiToApi(this.currentReproductiveStatus);
    if (!rawState) return;
    const userId = this.userInfoStore?.user?.id;
    if (!userId) {
      this.showToast('Error: User ID not found');
      return;
    }
    const payload: ReproductiveStatusData = this.mapUiToServicePayload(
      this.currentReproductiveStatus
    );

    if (this.currentReproductiveStatus === 'PLANNING_PREGNANCY' || 'PREGNANT') {
      // Assuming you have 'this.periodHistory' (the array you showed)
      const latestDate = this.getLatestPeriodDate(this.periodHistory());

      // Only attach it if it doesn't already exist in the payload
      if (latestDate && !payload.lastPeriodDate) {
        payload.lastPeriodDate = latestDate;
      }

      this.reproductiveStatus.updateReproductiveStatus(userId, data).subscribe({
        next: () => this.showToast('Status updated!'),
        error: () => this.showToast('Failed to update status.'),
      });
    }
  }
  private mapUiToServicePayload(
    uiStatus: string | null
  ): ReproductiveStatusData {
    debugger;
    switch (uiStatus) {
      case 'PREGNANT':
        return { isPregnant: true };
      case 'PLANNING_PREGNANCY':
        // Assuming 'planning' implies not pregnant, but you might need different flags
        // based on your backend. Adjust 'isPregnant: false' if needed.
        return { isPregnant: false };
      case 'NOT_PREGNANT':
      default:
        return { isPregnant: false };
    }
  }

  private mapUiToApi(ui: string | null): string | null {
    const map: any = {
      NOT_PREGNANT: 'cycle',
      PLANNING_PREGNANCY: 'planning',
      PREGNANT: 'pregnant',
    };
    return ui ? map[ui] ?? null : null;
  }

  // -----------------------------
  // NAVIGATION
  // -----------------------------
  editProfile() {
    this.router.navigate(['/edit-profile']);
  }

  goEdit(field: string) {
    this.router.navigate(['/edit-profile'], { queryParams: { focus: field } });
  }

  goToCycleCalendar() {
    this.router.navigate(['/period-date-picker']);
  }

  // -----------------------------
  // SHARE
  // -----------------------------
  async shareProfile() {
    const shareData = {
      title: 'My Profile - NouraCare',
      text: `My profile is ${this.profileCompletion.profileCompletion()}% complete.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        return await navigator.share(shareData);
      } catch {}
    }

    this.copyToClipboard(shareData.url);
    this.showToast('Profile link copied!');
  }

  private async copyToClipboard(txt: string) {
    await navigator.clipboard.writeText(txt);
  }

  // -----------------------------
  // TOAST
  // -----------------------------
  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
      color: 'dark',
    });
    toast.present();
  }
}


