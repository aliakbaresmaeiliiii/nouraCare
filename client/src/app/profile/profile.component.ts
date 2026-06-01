import {

  Component,

  CUSTOM_ELEMENTS_SCHEMA,

  ElementRef,

  inject,

  OnInit,

  signal,

  ViewChild,

} from '@angular/core';

import { Router } from '@angular/router';

import { ToastController, ViewWillEnter } from '@ionic/angular';

import { ModalController } from '@ionic/angular/standalone';

import { CycleSettingsService } from '../shared/services/cycle-settings.service';

import { ProfileCompletionService } from '../shared/services/profile-completion.service';

import { ReproductiveStatusService } from '../shared/services/reproductive-status.service';

import { UpdateReproductiveStateDto } from './models/UpdateReproductiveStateDto';

import { User } from '../shared/services/user';

import { UserSessionService } from '../shared/services/user-session.service';

import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

import { PregnancySetupSheetComponent } from '../shared/components/pregnancy-setup-sheet/pregnancy-setup-sheet.component';

import type {

  DashboardResponse,

  InitializeReproductiveStateDto,

} from '../shared/services/onboarding.service';

import { PeriodCycleStateService } from '../shared/services/period-cycle-state.service';

import { TranslationService } from '../shared/services/translation.service';

import { UserInfoService } from '../shared/services/user-info.service';

import { HomeJourneyBridgeService } from '../home/services/home-journey-bridge.service';

import { HomeReproductiveUiService } from '../home/services/home-reproductive-ui.service';

import { normalizeLmpInput } from '../shared/utils/pregnancy-lmp.util';

import {

  CycleSetupSheetResult,

  ReproductiveStatusComponent,

} from './reproductive-status/reproductive-status.component';



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

  private modalCtrl = inject(ModalController);

  private reproductiveStatus = inject(ReproductiveStatusService);

  private cycleSettings = inject(CycleSettingsService);

  private periodCycleState = inject(PeriodCycleStateService);

  private userService = inject(User);

  readonly profileCompletion = inject(ProfileCompletionService);

  userId = signal<number>(0);

  private userSession = inject(UserSessionService);

  private toastCtrl = inject(ToastController);

  private translation = inject(TranslationService);

  private homeReproUi = inject(HomeReproductiveUiService);

  private homeJourneyBridge = inject(HomeJourneyBridgeService);

  private userInfoService = inject(UserInfoService);

  userInfoStore: any = {};



  @ViewChild('profileAvatarInput') avatarInput!: ElementRef<HTMLInputElement>;



  currentReproductiveStatus: string | null = null;

  selectedTab = 'first';



  isUploadingAvatar = false;

  avatarSrc = '';

  avatarSkeleton = false;

  userActivity = signal([

    { key: 'friends', value: 20, labelKey: 'profile.statFriends' },

    { key: 'questions', value: 50, labelKey: 'profile.statQuestions' },

    { key: 'answers', value: 30, labelKey: 'profile.statAnswers' },

    { key: 'benefits', value: 40, labelKey: 'profile.statBenefits' },

  ]);



  readonly profileFields = [

    { key: 'name', labelKey: 'profile.fullName', icon: 'person-outline' },

    { key: 'email', labelKey: 'profile.emailAddress', icon: 'mail-outline' },

    { key: 'dateOfBirth', labelKey: 'profile.dateOfBirth', icon: 'calendar-outline' },

  ];



  isFieldCompleted(key: string): boolean {

    const data = this.profileCompletion.currentUserData;

    if (!data) return false;

    return !!data[key];

  }



  getFieldLabel(labelKey: string): string {

    return this.translation.translate(labelKey);

  }



  getFieldPlaceholder(labelKey: string): string {

    return `${this.translation.translate('profile.addFieldPrefix')} ${this.translation.translate(labelKey)}`;

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

  }



  ionViewWillEnter() {

    this.refreshProfile();

  }



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



    this.userSession.mergeIntoStoredUser(user);

  }



  openAvatarPicker() {

    if (this.isUploadingAvatar) return;

    this.avatarInput.nativeElement.click();

  }



  onAvatarFileSelected(e: Event) {

    const file = (e.target as HTMLInputElement).files?.[0];

    if (!file) return;



    if (!file.type.startsWith('image/')) {

      this.showToast(this.translation.translate('profile.toast.selectImage'));

      return;

    }

    if (file.size > 5 * 1024 * 1024) {

      this.showToast(this.translation.translate('profile.toast.imageTooLarge'));

      return;

    }



    this.uploadAvatar(file);

  }



  private uploadAvatar(file: File) {

    const id = this.userSession.getCurrentUserId();

    if (!id) {

      this.showToast(this.translation.translate('profile.toast.userNotFound'));

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

        this.showToast(this.translation.translate('profile.toast.uploadFailed'));

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



  setStatus(s: string | null) {

    this.currentReproductiveStatus = s;

  }



  isStatusSelected(s: string) {

    if (
      s === 'PLANNING_PREGNANCY' &&
      this.cycleSettings.getPregnantProfileCardPending()
    ) {
      return true;
    }
    return this.currentReproductiveStatus === s;
  }


  syncStatusFromApi() {

    const apiStatus = this.profileCompletion.currentUserData?.status;

    this.currentReproductiveStatus = this.normalizeStatus(apiStatus);

  }



  private normalizeStatus(s: string | null): string | null {

    if (!s) return 'NOT_PREGNANT';

    s = s.replace(/\s+/g, '_').toUpperCase();



    const map: Record<string, string> = {

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



    if (status === 'PLANNING_PREGNANCY') {

      await this.openCycleSetupSheet(status, 'planning');

      return;

    }



    if (status === 'NOT_PREGNANT') {

      await this.openCycleSetupSheet(status, 'cycle');

      return;

    }



    if (status === 'PREGNANT') {

      await this.openPregnancySetupSheet(status);

    }

  }



  private async openCycleSetupSheet(

    uiStatus: string,

    apiState: 'planning' | 'cycle',

  ): Promise<void> {

    const modal = await this.modalCtrl.create({

      component: ReproductiveStatusComponent,

      breakpoints: [0, 0.75, 1],

      initialBreakpoint: 0.75,

      backdropDismiss: true,

      cssClass: 'cycle-setup-sheet',

    });



    await modal.present();



    const { data, role } =

      await modal.onWillDismiss<CycleSetupSheetResult>();



    if (role !== 'confirm' || !data) {

      return;

    }



    const userId = this.userInfoStore?.user?.id;

    if (!userId) {

      this.showToast(this.translation.translate('profile.toast.userIdMissing'));

      return;

    }



    const payload: UpdateReproductiveStateDto = {

      state: apiState,

      lastPeriodDate: data.lastPeriodDate,

      cycleLength: Math.round(Number(data.cycleLength)),

    };



    this.reproductiveStatus.updateState(userId, payload).subscribe({

      next: (dashboard: DashboardResponse) => {

        this.finishReproductiveStatusSave(uiStatus, dashboard);

        this.applyLocalCycleSettingsFromForm(data, apiState);

        void this.periodCycleState.savePeriodStart(userId, {

          lastPeriodDateIso: data.lastPeriodDate,

          averagePeriodDuration: data.averagePeriodDuration,

          notes: 'Saved from profile cycle setup',

        });

      },

      error: (err) => {

        console.error('Failed to save cycle_data via PATCH /me/state:', err);

        this.showToast(this.translation.translate('profile.toast.cycleSaveFailed'));

      },

    });

  }



  private async openPregnancySetupSheet(uiStatus: string): Promise<void> {

    const modal = await this.modalCtrl.create({

      component: PregnancySetupSheetComponent,

      breakpoints: [0, 0.85, 1],

      initialBreakpoint: 0.85,

      backdropDismiss: false,

      cssClass: 'pregnancy-setup-sheet',

    });



    await modal.present();



    const { data, role } =

      await modal.onWillDismiss<InitializeReproductiveStateDto>();



    if (role !== 'confirm' || !data) {

      return;

    }



    const userId = this.userInfoStore?.user?.id;

    if (!userId) {

      this.showToast(this.translation.translate('profile.toast.userIdMissing'));

      return;

    }



    this.reproductiveStatus.updateState(userId, data).subscribe({

      next: (dashboard: DashboardResponse) => {

        this.finishReproductiveStatusSave(uiStatus, dashboard);

      },

      error: () =>

        this.showToast(this.translation.translate('profile.toast.pregnancySaveFailed')),

    });

  }



  /** Mirror form values locally, then let dashboard sync refine them on Home. */

  private applyLocalCycleSettingsFromForm(

    data: CycleSetupSheetResult,

    apiState: 'planning' | 'cycle',

  ): void {

    this.cycleSettings.setCycleLength(Math.round(Number(data.cycleLength)));

    this.cycleSettings.setPeriodLength(data.averagePeriodDuration);

    this.cycleSettings.setLastPeriodStart(data.lastPeriodDate);

    this.cycleSettings.setPregnancyStatus(false);

    this.cycleSettings.setPostpartumStatus(false);



    if (apiState === 'planning') {

      this.cycleSettings.applyTryingToConceiveHomeMode();

      return;

    }



    this.cycleSettings.clearGetPregnantProfileCardPending();

    this.cycleSettings.setUserStatus('Cycle Tracking');

  }



  /**

   * Single exit path: sync Home from PATCH dashboard response, refresh profile, go Home.

   */

  private finishReproductiveStatusSave(

    uiStatus: string,

    dashboard: DashboardResponse,

  ): void {

    this.setStatus(uiStatus);

    if (uiStatus === 'PREGNANT') {

      this.applyLocalPregnancySettingsFromDashboard(dashboard);

    }

    this.pushHomeJourneyFromDashboard(dashboard);

    this.profileCompletion.refreshFromAPI().subscribe();

    this.router.navigate(['/tabs/home'], { replaceUrl: true });

  }



  /** Mirror pregnancy dashboard locally so Home tab reflects mode before remote sync. */

  private applyLocalPregnancySettingsFromDashboard(

    dashboard: DashboardResponse,

  ): void {

    this.cycleSettings.setUserStatus('Pregnant');

    this.cycleSettings.setPregnancyStatus(true);

    this.cycleSettings.setPostpartumStatus(false);

    this.cycleSettings.clearGetPregnantProfileCardPending();

    if (dashboard.week != null) {

      this.cycleSettings.setPregnancyWeek(dashboard.week);

    }

    if (dashboard.progress != null) {

      this.cycleSettings.setPregnancyProgress(

        Math.min(100, Math.round(Number(dashboard.progress) * 100)),

      );

    }

    const lmp = normalizeLmpInput(dashboard.lastMenstrualPeriod ?? undefined);

    if (lmp) {

      this.cycleSettings.setLastPeriodStart(lmp);

    }

  }



  private pushHomeJourneyFromDashboard(dashboard: DashboardResponse): void {

    const state = this.homeReproUi.synchronizeFromDashboardAndJourney(

      dashboard,

      this.userInfoService.onboardingJourney(),

    );

    this.homeJourneyBridge.pushJourneyStateFromWeekDetail(state);

  }



  editProfile() {

    this.router.navigate(['/edit-profile']);

  }



  goEdit(field: string) {

    this.router.navigate(['/edit-profile'], { queryParams: { focus: field } });

  }



  goToCycleCalendar() {

    this.router.navigate(['/period-date-picker']);

  }



  async shareProfile() {

    const shareData = {

      title: this.translation.translate('profile.shareTitle'),

      text: this.translation.translateParams('profile.shareText', {

        percent: this.profileCompletion.profileCompletion(),

      }),

      url: window.location.href,

    };



    if (navigator.share) {

      try {

        return await navigator.share(shareData);

      } catch {}

    }



    this.copyToClipboard(shareData.url);

    this.showToast(this.translation.translate('profile.linkCopied'));

  }



  private async copyToClipboard(txt: string) {

    await navigator.clipboard.writeText(txt);

  }



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


