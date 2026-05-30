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
    this.getPeriodLogs();
  }

  getPeriodLogs() {
    this.reproductiveStatus
      .getPeriodLogs(this.userId())
      .subscribe((res: any) => {
        console.log('aaaaaaaaa', res);
        this.periodHistory.set(res);
      });
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

//   currentReproductiveStatus: string | null = null;

//   selectedTab = 'first';
//   // swiperEl = viewChild('swiperContainer');
//   userInfoStore: any = {};
//   fullName: string = '';
//   email: string = '';
//   dateOfBirth: string = '';
//   city: string = '';
//   profileImage: string | null = null;
//   private userService = inject(User);
//   private homeService = inject(HomeDataService);
//   private userSession = inject(UserSessionService);
//   private imageUrlService = inject(ImageUrlService);
//   public profileCompletionService = inject(ProfileCompletionService);
//   private reproductiveStatusService = inject(ReproductiveStatusService);
//   private userInfoService = inject(UserInfoService);
//   private cycleSettings = inject(CycleSettingsService);
//   private onboardingService = inject(OnboardingService);
//   private modalCtrl = inject(ModalController);
//   private alertController = inject(AlertController);
//   private cdr = inject(ChangeDetectorRef);
//   userId = 0;

//   /**
//    * Avatar img src — updated when GET /user returns. Stored as a field so change detection
//    * refreshes the image (a getter reading only the service signal can fail to update the view).
//    */
//   avatarImageSrc = this.imageUrlService.getImageUrl(null);
//   avatarImgLoaded = true;
//   avatarSkeletonActive = false;
//   private lastAvatarImageSrc = this.avatarImageSrc;
//   isUploadingAvatar = false;
//   get isExperienceLoading(): boolean {
//     return this.profileCompletionService.loading;
//   }
//   // Use the service's computed signal for percent
//   get percent(): number {
//     const completion = this.profileCompletionService.profileCompletion();
//     return completion;
//   }

//   // Getter methods for field completion status
//   get isNameCompleted(): boolean {
//     return this.profileCompletionService.isNameCompleted;
//   }

//   get isEmailCompleted(): boolean {
//     return this.profileCompletionService.isEmailCompleted;
//   }

//   get isDateOfBirthCompleted(): boolean {
//     return this.profileCompletionService.currentUserData?.dateOfBirth
//       ? true
//       : false;
//   }

//   get currentUserData(): any {
//     return this.profileCompletionService.currentUserData;
//   }

//   ngOnInit(): void {
//     this.userId = this.homeService.getCurrentUserId();
//     this.patchValueUser();
//   }
//   patchValueUser() {
//     this.userInfoStore = this.userSession.getUserInfoStoreOrEmpty();
//     const u = this.userInfoStore?.user || {};
//     this.fullName = u.fullName || u.name || '';
//     this.email = u.email || '';
//     this.dateOfBirth = u.dateOfBirth || '';
//     this.city = u.city || '';
//     const quick = this.imageUrlService.getImageUrl(
//       u.profileImage ?? u.profile_img ?? null
//     );
//     this.profileImage = quick;
//     this.avatarImageSrc = quick;
//     this.lastAvatarImageSrc = quick;
//     this.avatarImgLoaded = true;
//     this.avatarSkeletonActive = false;
//     this.syncCurrentStatusFromProfileData();
//     this.applyStatusFromQuery();
//   }

//   formatDateOnly(value: unknown): string {
//     const s = String(value ?? '').trim();
//     if (!s || s === 'null' || s === 'undefined') return '';

//     const normalized = s.replace(/^["']|["']$/g, '');
//     if (!normalized) return '';

//     // Handle ISO strings like: 2026-03-17T07:42:00.000Z
//     const isoDateMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})/);
//     if (isoDateMatch?.[1]) return isoDateMatch[1];
//     // Fallback: attempt parsing.
//     const d = new Date(normalized);
//     if (Number.isNaN(d.getTime())) return s;
//     return d.toISOString().slice(0, 10);
//   }

//   onAvatarImgLoad(): void {
//     this.avatarImgLoaded = true;
//     this.avatarSkeletonActive = false;
//     this.cdr.markForCheck();
//   }

//   openAvatarPicker(): void {
//     if (this.isUploadingAvatar) return;
//     const input = document.getElementById(
//       'profileAvatarInput'
//     ) as HTMLInputElement | null;
//     input?.click();
//   }

//   onAvatarFileSelected(event: Event): void {
//     const input = event.target as HTMLInputElement;
//     const file = input.files?.[0];
//     if (!file) return;

//     if (!file.type.startsWith('image/')) {
//       alert('Please select an image file.');
//       input.value = '';
//       return;
//     }

//     if (file.size > 5 * 1024 * 1024) {
//       alert('Image file size should be less than 5MB.');
//       input.value = '';
//       return;
//     }

//     const id =
//       this.userInfoStore?.user?.id ??
//       this.userInfoStore?.data?.id ??
//       this.userSession.getCurrentUserId();
//     if (!id) {
//       alert('User not found. Please sign in again.');
//       input.value = '';
//       return;
//     }

//     const previewUrl = URL.createObjectURL(file);
//     this.isUploadingAvatar = true;
//     this.avatarImgLoaded = false;
//     this.avatarSkeletonActive = true;
//     this.avatarImageSrc = previewUrl;
//     this.cdr.markForCheck();

//     this.userService.uploadProfileImage(String(id), file).subscribe({
//       next: (res: any) => {
//         URL.revokeObjectURL(previewUrl);
//         const serverUrl = this.imageUrlService.getImageUrl(res.url);
//         this.avatarImageSrc = serverUrl;
//         this.profileImage = serverUrl;
//         this.lastAvatarImageSrc = serverUrl;
//         this.avatarImgLoaded = true;
//         this.avatarSkeletonActive = false;
//         this.isUploadingAvatar = false;
//         try {
//           this.userSession.mergeIntoStoredUser({ profileImage: res.url });
//         } catch {
//           // Non-blocking: server succeeded even if local merge fails.
//         }
//         input.value = '';
//         this.cdr.markForCheck();
//       },
//       error: (err) => {
//         console.error('Error uploading profile image from profile page:', err);
//         URL.revokeObjectURL(previewUrl);
//         this.avatarImageSrc =
//           this.lastAvatarImageSrc || this.imageUrlService.getImageUrl(null);
//         this.avatarImgLoaded = true;
//         this.avatarSkeletonActive = false;
//         this.isUploadingAvatar = false;
//         input.value = '';
//         alert('Failed to upload image. Please try again.');
//         this.cdr.markForCheck();
//       },
//     });
//   }

//   // Reproductive status data
//   reproductiveStatus: ReproductiveStatusData = {};
//   cycleLengthOptions = [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35];
//   lastPeriodDate: string = '';
//   selectedCycleLength: number = 28;

//   userInfo = signal<any[]>([
//     {
//       friends: 20,
//       Question: 50,
//       Answers: 30,
//       Benefits: 40,
//     },
//   ]);

//   isShowBtn = false;
//   title = '';
//   currentSlide: number = 1;
//   dotHelper: Array<Number> = [];

//   // @ViewChild('sliderRef') sliderRef!: ElementRef<HTMLElement>;

//   segmentChanged(ev: any) {
//     this.selectedTab = ev.detail.value;
//   }

//   someFunction() {}

//   editProfile() {
//     // Logic to edit profile
//     this.router.navigate(['/edit-profile']);
//   }

//   setStatus(statusValue: string | null): void {
//     this.currentReproductiveStatus = statusValue;
//   }

//   isStatusSelected(statusValue: string): boolean {
//     return this.currentReproductiveStatus === statusValue;
//   }

//   getCurrentStatus(): string | null {
//     return this.currentReproductiveStatus;
//   }

//   onTrackCycleCardClick(): void {
//     if (this.isStatusSelected('NOT_PREGNANT')) {
//       return;
//     }
//     this.cycleSettings.clearGetPregnantProfileCardPending();
//     this.onUpdateReproductiveStatus();
//   }

//   onTrackPlanningCardClick(): void {
//     if (this.isStatusSelected('PLANNING_PREGNANCY')) {
//       return;
//     }
//     this.setStatus('PLANNING_PREGNANCY');
//     this.onUpdateReproductiveStatus();

//   }

//   async onSubmit(_source: 'continue' | 'save' = 'continue'): Promise<void> {
//     debugger;
//     const selected = this.getCurrentStatus();
//     if (!selected) return;

//     const state = this.mapUiReproductiveToApiPregnancyStatus(selected);
//     if (!state) return;
//     this.onboardingService.updateReproductiveState({ state }).subscribe({
//       next: () => {
//         this.showToast('Reproductive status updated successfully!');
//         this.profileCompletionService.refreshFromAPI().subscribe({
//           next: () => this.syncCurrentStatusFromProfileData(),
//         });
//         if (selected === 'NOT_PREGNANT') {
//           this.goToCycleCalendar();
//           return;
//         }
//         if (selected === 'PLANNING_PREGNANCY') {
//           this.goToPregnancyPlanning();
//         }
//       },
//       error: () => this.showToast('Failed to update reproductive status.'),
//     });
//   }

//   private mapUiReproductiveToApiPregnancyStatus(
//     ui: string | null | undefined
//   ): ReproductiveState | null {
//     if (!ui) return null;
//     if (ui === 'NOT_PREGNANT') return 'cycle';
//     if (ui === 'PLANNING_PREGNANCY') return 'planning';
//     if (ui === 'PREGNANT') return 'pregnant';
//     return null;
//   }

//   private syncCurrentStatusFromProfileData(): void {
//     const merged = this.profileCompletionService.currentUserData?.status;
//     debugger;
//     const fromApi = this.normalizeExperienceCardFromApi(
//       String(merged ?? '').trim()
//     );
//     const journeyRow = this.userInfoService.onboardingJourney();
//     const journeyPs = journeyRow?.pregnancyStatus;
//     const fromJourney =
//       typeof journeyPs === 'string' || typeof journeyPs === 'number'
//         ? this.normalizeExperienceCardFromApi(String(journeyPs).trim())
//         : null;

//     let next: string | null = null;

//     if (fromApi === 'PREGNANT') {
//       next = 'PREGNANT';
//       this.cycleSettings.clearGetPregnantProfileCardPending();
//     } else if (fromApi === 'POSTPARTUM') {
//       next = 'POSTPARTUM';
//       this.cycleSettings.clearGetPregnantProfileCardPending();
//     } else if (fromApi === 'PLANNING_PREGNANCY') {
//       next = 'PLANNING_PREGNANCY';
//       this.cycleSettings.clearGetPregnantProfileCardPending();
//     } else if (fromApi === 'NOT_PREGNANT') {
//       next = this.cycleSettings.getPregnantProfileCardPending()
//         ? 'PLANNING_PREGNANCY'
//         : 'NOT_PREGNANT';
//     } else if (
//       fromJourney === 'PREGNANT' ||
//       fromJourney === 'PLANNING_PREGNANCY' ||
//       fromJourney === 'NOT_PREGNANT' ||
//       fromJourney === 'POSTPARTUM'
//     ) {
//       if (
//         fromJourney === 'NOT_PREGNANT' &&
//         this.cycleSettings.getPregnantProfileCardPending()
//       ) {
//         // Keep Profile "Get pregnant" highlighted while journey status is still stale.
//         next = 'PLANNING_PREGNANCY';
//       } else {
//         next = fromJourney;
//       }
//       if (fromJourney === 'PLANNING_PREGNANCY') {
//         this.cycleSettings.clearGetPregnantProfileCardPending();
//       }
//     } else if (this.cycleSettings.getPregnantProfileCardPending()) {
//       next = 'PLANNING_PREGNANCY';
//     }

//     if (next == null) {
//       next = 'NOT_PREGNANT';
//     }
//     debugger;
//     this.currentReproductiveStatus = next;
//     this.cdr.markForCheck();
//   }

//   /**
//    * Normalize API/dashboard/journey pregnancy labels to Profile experience-card keys.
//    */
//   private normalizeExperienceCardFromApi(raw: string): string | null {
//     if (!raw) return null;

//     const u = raw.trim().replace(/\s+/g, '_').toUpperCase();
//     if (u === 'PREGNANT' || u === 'PREGNANCY' || u === 'EXPECTING') {
//       return 'PREGNANT';
//     }
//     if (
//       u === 'PLANNING_PREGNANCY' ||
//       u === 'TRYING_TO_CONCEIVE' ||
//       u === 'TRYING_TO_CONCEPTION' ||
//       u === 'PLANNING'
//     ) {
//       return 'PLANNING_PREGNANCY';
//     }
//     if (u === 'POSTPARTUM' || u === 'HAS_CHILD') {
//       return 'POSTPARTUM';
//     }

//     const compactNoUs = raw.replace(/[\s_-]/g, '').toUpperCase();
//     if (compactNoUs.includes('TRYING') || compactNoUs.includes('CONCEIVE')) {
//       return 'PLANNING_PREGNANCY';
//     }
//     if (
//       u === 'NOT_PREGNANT' ||
//       u === 'NOT_PLANNING' ||
//       u === 'NOTPLANNING' ||
//       u === 'NOT_PREGNANCY_PLANNING' ||
//       compactNoUs === 'CYCLE' ||
//       compactNoUs === 'TRACKING' ||
//       compactNoUs.includes('TRACKCYCLE')
//     ) {
//       return 'NOT_PREGNANT';
//     }

//     return null;
//   }

//   async openPregnancyEndDialog() {
//     const modal = await this.modalCtrl.create({
//       component: PregnancyEndDialogComponent,
//     });

//     await modal.present();

//     const { data, role } = await modal.onWillDismiss();

//     if (role === 'confirm' && data) {
//       const updateData = {
//         isPregnant: false,
//         pregnancyEndDate: data.pregnancyEndDate,
//         notes: data.notes,
//       };

//       this.updateReproductiveStatus(updateData);
//     }
//   }

//   updateReproductiveStatus(data: ReproductiveStatusData) {
//     debugger;
//     const userId = this.userInfoStore?.user?.id;
//     if (!userId) {
//       console.error('User ID not found');
//       this.showToast('Error: User ID not found');
//       return;
//     }

//     this.reproductiveStatusService
//       .updateReproductiveStatus(userId, data)
//       .subscribe({
//         next: (response) => {
//           // this.loadReproductiveStatus(); // Refresh data
//           this.showToast('Status updated successfully!');
//         },
//         error: (error) => {
//           console.error('Error updating reproductive status:', error);
//           this.showToast('Error updating status. Please try again.');
//         },
//       });
//   }

//   onUpdateReproductiveStatus() {
//     debugger;
//     if (!this.lastPeriodDate) {
//       this.showToast('Please select your last period date');
//       return;
//     }

//     const updateData: ReproductiveStatusData = {
//       lastPeriodDate: this.lastPeriodDate,
//       cycleLength: this.selectedCycleLength,
//       isPregnant: false, // Ensure pregnancy status is false when tracking periods
//     };

//     this.updateReproductiveStatus(updateData);
//   }

//   goToCycleCalendar() {
//     this.router.navigate(['/period-date-picker']);
//   }

//   getTodayDate(): string {
//     return new Date().toISOString();
//   }

//   formatDate(dateString: string): string {
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });
//   }

//   getPregnancyWeek(): number {
//     if (!this.reproductiveStatus.lastPeriodDate) return 0;

//     const lastPeriod = new Date(this.reproductiveStatus.lastPeriodDate);
//     const today = new Date();
//     const diffTime = today.getTime() - lastPeriod.getTime();
//     const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

//     return Math.floor(diffDays / 7);
//   }

//   private showToast(message: string) {
//     const toast = document.createElement('div');
//     toast.style.cssText = `
//       position: fixed;
//       bottom: 20px;
//       left: 50%;
//       transform: translateX(-50%);
//       background: var(--ion-color-dark);
//       color: white;
//       padding: 12px 20px;
//       border-radius: 8px;
//       z-index: 10000;
//       font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//       max-width: 300px;
//       text-align: center;
//     `;
//     toast.textContent = message;
//     document.body.appendChild(toast);

//     setTimeout(() => {
//       if (toast.parentNode) {
//         toast.remove();
//       }
//     }, 3000);
//   }

//   goEdit(field: string) {
//     this.router.navigate(['/edit-profile'], { queryParams: { focus: field } });
//   }

//   goToPregnancyPlanning() {
//     this.router.navigate(['/pregnancy-planning']);
//   }

//   async shareProfile() {
//     try {
//       // Create share data
//       const shareData = {
//         title: 'My Profile - NouraCare',
//         text: `Check out my profile on NouraCare! I'm ${
//           this.fullName || 'a user'
//         } and my profile is ${this.percent}% complete.`,
//         url: window.location.href,
//       };

//       // Try Web Share API first (works on mobile browsers)
//       if (navigator.share) {
//         try {
//           await navigator.share(shareData);
//           return;
//         } catch (error) {
//           console.log('Web Share API failed:', error);
//         }
//       }

//       // Try Capacitor Share plugin (for native apps)
//       try {
//         await Share.share(shareData);
//         return;
//       } catch (error) {
//         console.log('Capacitor Share failed:', error);
//       }

//       // Fallback: Copy to clipboard
//       const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
//       await this.copyToClipboard(shareText);
//       this.showShareSuccessAlert();
//     } catch (error) {
//       console.error('Error sharing profile:', error);
//       // Final fallback: Copy to clipboard
//       try {
//         const fallbackText = `My Profile - NouraCare\nCheck out my profile: ${window.location.href}`;
//         await this.copyToClipboard(fallbackText);
//         this.showShareSuccessAlert();
//       } catch (clipboardError) {
//         console.error('Error copying to clipboard:', clipboardError);
//         this.showShareErrorAlert();
//       }
//     }
//   }

//   private async copyToClipboard(text: string): Promise<void> {
//     if (navigator.clipboard && navigator.clipboard.writeText) {
//       await navigator.clipboard.writeText(text);
//     } else {
//       // Fallback for older browsers
//       const textArea = document.createElement('textarea');
//       textArea.value = text;
//       textArea.style.position = 'fixed';
//       textArea.style.left = '-999999px';
//       textArea.style.top = '-999999px';
//       document.body.appendChild(textArea);
//       textArea.focus();
//       textArea.select();
//       document.execCommand('copy');
//       document.body.removeChild(textArea);
//     }
//   }

//   private showShareSuccessAlert() {
//     const alert = document.createElement('div');
//     alert.style.cssText = `
//       position: fixed;
//       top: 20px;
//       right: 20px;
//       background: #4CAF50;
//       color: white;
//       padding: 16px 20px;
//       border-radius: 8px;
//       box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
//       z-index: 10000;
//       font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//       max-width: 300px;
//       animation: slideIn 0.3s ease-out;
//     `;

//     const style = document.createElement('style');
//     style.textContent = `
//       @keyframes slideIn {
//         from { transform: translateX(100%); opacity: 0; }
//         to { transform: translateX(0); opacity: 1; }
//       }
//     `;
//     document.head.appendChild(style);

//     alert.textContent = '✅ Profile link copied to clipboard!';
//     document.body.appendChild(alert);

//     setTimeout(() => {
//       if (alert.parentNode) {
//         alert.remove();
//       }
//     }, 3000);
//   }

//   private showShareErrorAlert() {
//     const alert = document.createElement('div');
//     alert.style.cssText = `
//       position: fixed;
//       top: 20px;
//       right: 20px;
//       background: #c21e56;
//       color: white;
//       padding: 16px 20px;
//       border-radius: 8px;
//       box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
//       z-index: 10000;
//       font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
//       max-width: 300px;
//       animation: slideIn 0.3s ease-out;
//     `;

//     const style = document.createElement('style');
//     style.textContent = `
//       @keyframes slideIn {
//         from { transform: translateX(100%); opacity: 0; }
//         to { transform: translateX(0); opacity: 1; }
//       }
//     `;
//     document.head.appendChild(style);

//     alert.textContent = '❌ Failed to share profile. Please try again.';
//     document.body.appendChild(alert);

//     setTimeout(() => {
//       if (alert.parentNode) {
//         alert.remove();
//       }
//     }, 3000);
//   }

//   /**
//    * Optimistic labels from localStorage only — do not set avatar here; that was overwriting
//    * the real URL after GET /user when ionViewWillEnter ran with empty stored profileImage.
//    */
//   refreshProfileData() {
//     try {
//       this.userInfoStore = this.userSession.getUserInfoStoreOrEmpty();
//       const u = this.userInfoStore?.user || {};
//       this.fullName = u.fullName || u.name || this.fullName;
//       this.email = u.email || this.email;
//       this.dateOfBirth = u.dateOfBirth || this.dateOfBirth;
//       this.city = u.city || this.city;
//     } catch {}
//   }

//   private applyProfileFromMerged(merged: any): void {
//     this.fullName = merged.fullName || this.fullName;
//     this.email = merged.email || this.email;
//     this.dateOfBirth = merged.dateOfBirth || this.dateOfBirth;
//     this.city = merged.city ?? this.city;
//     this.profileImage = merged.profileImage;
//     const nextAvatarSrc = merged.profileImage;
//     if (nextAvatarSrc && nextAvatarSrc !== this.lastAvatarImageSrc) {
//       // Show skeleton only while avatar is being replaced after edit-profile.
//       this.avatarImgLoaded = false;
//       this.avatarSkeletonActive = true;
//     } else {
//       this.avatarImgLoaded = true;
//       this.avatarSkeletonActive = false;
//     }
//     this.lastAvatarImageSrc = nextAvatarSrc;
//     this.avatarImageSrc = nextAvatarSrc;
//     try {
//       this.userInfoStore = this.userSession.getUserInfoStoreOrEmpty();
//       if (this.userInfoStore?.user) {
//         this.userInfoStore.user = {
//           ...this.userInfoStore.user,
//           ...merged,
//         };
//       }
//     } catch {
//       /* ignore */
//     }
//     this.cdr.markForCheck();
//   }

//   onAvatarImgError(): void {
//     this.avatarImageSrc = this.imageUrlService.getImageUrl(null);
//     this.avatarImgLoaded = true;
//     this.avatarSkeletonActive = false;
//     this.cdr.markForCheck();
//   }

//   ionViewWillEnter(): void {
//     this.refreshProfileData();
//     this.profileCompletionService.refreshFromAPI().subscribe({
//       next: (merged) => {
//         if (merged) {
//           this.applyProfileFromMerged(merged);
//         }
//         this.syncCurrentStatusFromProfileData();
//         this.applyStatusFromQuery();
//       },
//     });
//   }

//   private applyStatusFromQuery(): void {
//     const selectedFromQuery =
//       this.route.snapshot.queryParamMap.get('selectStatus');
//     if (selectedFromQuery === 'PREGNANT') {
//       this.currentReproductiveStatus = 'PREGNANT';
//       this.cdr.markForCheck();
//     }
//   }
// }
