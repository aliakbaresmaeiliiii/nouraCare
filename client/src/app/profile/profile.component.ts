import {

  Component,

  CUSTOM_ELEMENTS_SCHEMA,

  ElementRef,

  inject,

  OnDestroy,

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

import { ImageUrlService } from '../shared/services/image-url.service';

import { UserSessionService } from '../shared/services/user-session.service';

import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

import { PregnancySetupSheetComponent } from '../shared/components/pregnancy-setup-sheet/pregnancy-setup-sheet.component';
import {
  MenopauseSetupSheetComponent,
  MenopauseSetupSheetResult,
} from '../shared/components/menopause-setup-sheet/menopause-setup-sheet.component';
import { ReproductiveStatusPickerComponent } from '../shared/components/reproductive-status-picker/reproductive-status-picker.component';
import {
  isReproductiveUiStatusSelected,
  normalizeReproductiveUiStatus,
} from '../shared/reproductive-status/reproductive-status.mapper';

import type {

  DashboardResponse,

  InitializeReproductiveStateDto,

} from '../shared/services/onboarding.service';

import { PeriodCycleStateService } from '../shared/services/period-cycle-state.service';

import { TranslationService } from '../shared/services/translation.service';
import { LanguageService } from '../shared/services/language.service';
import { formatJalaliFaFromIso } from '../shared/utils/jalali-iranian-calendar.util';
import {
  formatHistoryDayDate,
  isPersianAppLanguage,
} from '../shared/utils/locale-date-format.util';

import { UserInfoService } from '../shared/services/user-info.service';

import { HomeJourneyBridgeService } from '../home/services/home-journey-bridge.service';

import { HomeReproductiveUiService } from '../home/services/home-reproductive-ui.service';

import { normalizeLmpInput } from '../shared/utils/pregnancy-lmp.util';

import { ForumService } from '../shared/services/forum.service';

import type {
  UserForumActivityType,
  UserForumAnswer,
  UserForumQuestion,
} from '../shared/models/forum';

import { Subscription } from 'rxjs';

import { finalize } from 'rxjs/operators';

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

  standalone: true,

  imports: [...SHARED_STANDALONE_IMPORTS, ReproductiveStatusPickerComponent],

  styleUrls: ['./profile.component.scss'],

  schemas: [CUSTOM_ELEMENTS_SCHEMA],

  host: { class: 'ion-page' },

})

export class ProfileComponent implements OnInit, ViewWillEnter, OnDestroy {

  private router = inject(Router);

  private modalCtrl = inject(ModalController);

  private reproductiveStatus = inject(ReproductiveStatusService);

  private cycleSettings = inject(CycleSettingsService);

  private periodCycleState = inject(PeriodCycleStateService);

  private userService = inject(User);

  readonly profileCompletion = inject(ProfileCompletionService);

  userId = signal<number>(0);

  private userSession = inject(UserSessionService);

  private imageUrlService = inject(ImageUrlService);

  private toastCtrl = inject(ToastController);

  private translation = inject(TranslationService);

  private languageService = inject(LanguageService);

  private homeReproUi = inject(HomeReproductiveUiService);

  private homeJourneyBridge = inject(HomeJourneyBridgeService);

  private userInfoService = inject(UserInfoService);

  private forumService = inject(ForumService);

  private forumActivitySub?: Subscription;

  userInfoStore: any = {};



  @ViewChild('profileAvatarInput') avatarInput!: ElementRef<HTMLInputElement>;

  currentReproductiveStatus: string | null = null;

  selectedTab = 'first';

  /** Page size for profile activity tabs. */
  readonly activityPageSize = 20;

  private readonly activeTabLoading = signal(false);
  private readonly activeTabLoadingMore = signal(false);

  private readonly activityTabBySegment: Record<
    string,
    UserForumActivityType
  > = {
    first: 'questions',
    second: 'answers',
    third: 'experiences',
  };

  private readonly activityFetchState: Record<
    UserForumActivityType,
    {
      page: number;
      hasMore: boolean;
      loading: boolean;
      loadingMore: boolean;
      loaded: boolean;
    }
  > = {
    questions: {
      page: 0,
      hasMore: true,
      loading: false,
      loadingMore: false,
      loaded: false,
    },
    answers: {
      page: 0,
      hasMore: true,
      loading: false,
      loadingMore: false,
      loaded: false,
    },
    experiences: {
      page: 0,
      hasMore: true,
      loading: false,
      loadingMore: false,
      loaded: false,
    },
  };

  isUploadingAvatar = false;

  avatarSrc = '';

  avatarSkeleton = false;

  userActivity = signal([

    { key: 'friends', value: 0, labelKey: 'profile.statFriends' },

    { key: 'questions', value: 0, labelKey: 'profile.statQuestions' },

    { key: 'answers', value: 0, labelKey: 'profile.statAnswers' },

    { key: 'benefits', value: 0, labelKey: 'profile.statBenefits' },

  ]);

  userQuestions = signal<UserForumQuestion[]>([]);

  userAnswers = signal<UserForumAnswer[]>([]);

  userExperiences = signal<UserForumQuestion[]>([]);



  readonly profileFields = [

    { key: 'name', labelKey: 'profile.fullName', icon: 'person-outline' },

    { key: 'email', labelKey: 'profile.emailAddress', icon: 'mail-outline' },

    { key: 'dateOfBirth', labelKey: 'profile.dateOfBirth', icon: 'calendar-outline' },

  ];



  isFieldCompleted(key: string): boolean {

    const data = this.profileCompletion.currentUserData;

    if (!data) return false;

    if (key === 'dateOfBirth') {
      return !!(this.toDateOnly(data['dateOfBirth'] ?? data['birthday'] ?? ''));
    }

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

    if (!data) return '';

    if (key === 'dateOfBirth') {
      const iso = this.toDateOnly(data['dateOfBirth'] ?? data['birthday'] ?? '');
      if (!iso) return '';
      const lang = this.languageService.getCurrentLanguage();
      if (isPersianAppLanguage(lang)) {
        return formatJalaliFaFromIso(iso, 'DD MMMM YYYY');
      }
      const [y, m, d] = iso.split('-').map((n) => parseInt(n, 10));
      return formatHistoryDayDate(new Date(y, m - 1, d), lang);
    }

    return data?.[key] || '';

  }

  private toDateOnly(value: unknown): string {
    const s = String(value ?? '').trim();
    if (!s || s === 'null' || s === 'undefined') return '';
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m?.[1]) return m[1];
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
  }



  patchValueUser() {

    this.userInfoStore = this.userSession.getUserInfoStoreOrEmpty();

  }



  ngOnInit() {

    this.loadInitialProfile();

    this.patchValueUser();

    this.userId.set(this.userInfoStore?.user?.id);

    this.loadActivityTab('questions', true);

    this.forumActivitySub = this.forumService.postDeleted$.subscribe(() => {

      this.reloadActiveActivityTab();

    });

  }



  ngOnDestroy() {

    this.forumActivitySub?.unsubscribe();

  }



  ionViewWillEnter() {

    this.refreshProfile();

    this.reloadActiveActivityTab();

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



  onActivityTabChanged(tab: string) {

    const type = this.activityTabBySegment[tab];

    if (!type) return;

    const state = this.activityFetchState[type];

    if (!state.loaded) {
      this.loadActivityTab(type, true);
    }
  }



  reloadActiveActivityTab() {

    this.loadActivityTab(this.getActiveActivityType(), true);

  }



  getActiveActivityType(): UserForumActivityType {

    return this.activityTabBySegment[this.selectedTab] ?? 'questions';

  }



  isActiveTabLoading(): boolean {
    return this.activeTabLoading();
  }

  isActiveTabLoadingMore(): boolean {
    return this.activeTabLoadingMore();
  }

  private loadActivityTab(type: UserForumActivityType, reset: boolean) {

    const state = this.activityFetchState[type];

    if (state.loading || state.loadingMore) {

      return;

    }

    if (!reset && !state.hasMore) {

      return;

    }



    const nextPage = reset ? 1 : state.page + 1;



    if (reset) {

      state.page = 0;

      state.hasMore = true;

      state.loaded = false;

      this.setActivityItems(type, []);

    }



    state.loading = reset;
    state.loadingMore = !reset;
    this.activeTabLoading.set(reset);
    this.activeTabLoadingMore.set(!reset);

    this.forumService

      .getUserForumActivity(nextPage, this.activityPageSize, type)

      .pipe(

        finalize(() => {
          state.loading = false;
          state.loadingMore = false;
          this.activeTabLoading.set(false);
          this.activeTabLoadingMore.set(false);
        }),

      )

      .subscribe({

        next: (response) => {

          if (!response?.success || !response.data) return;



          const { stats, pagination } = response.data;

          const items = this.extractActivityItems(type, response.data);



          state.page = pagination?.page ?? nextPage;

          state.hasMore = pagination?.hasMore ?? false;

          state.loaded = true;



          if (reset) {

            this.setActivityItems(type, items);

          } else {

            this.appendActivityItems(type, items);

          }



          if (stats) {

            this.userActivity.update((activityItems) =>

              activityItems.map((item) => {

                if (item.key === 'questions') {

                  return { ...item, value: stats.questions ?? 0 };

                }

                if (item.key === 'answers') {

                  return { ...item, value: stats.answers ?? 0 };

                }

                return item;

              }),

            );

          }

        },

        error: () => {

          if (reset) {

            this.setActivityItems(type, []);

          }

          state.hasMore = false;

        },

      });

  }



  private extractActivityItems(

    type: UserForumActivityType,

    data: {

      questions?: UserForumQuestion[];

      answers?: UserForumAnswer[];

      experiences?: UserForumQuestion[];

    },

  ): Array<UserForumQuestion | UserForumAnswer> {

    if (type === 'answers') {

      return data.answers ?? [];

    }

    if (type === 'experiences') {

      return data.experiences ?? [];

    }

    return data.questions ?? [];

  }



  private setActivityItems(

    type: UserForumActivityType,

    items: Array<UserForumQuestion | UserForumAnswer>,

  ) {

    if (type === 'answers') {

      this.userAnswers.set(items as UserForumAnswer[]);

      return;

    }

    if (type === 'experiences') {

      this.userExperiences.set(items as UserForumQuestion[]);

      return;

    }

    this.userQuestions.set(items as UserForumQuestion[]);

  }



  private appendActivityItems(

    type: UserForumActivityType,

    items: Array<UserForumQuestion | UserForumAnswer>,

  ) {

    if (items.length === 0) return;



    if (type === 'answers') {

      const existing = new Set(this.userAnswers().map((item) => item.id));

      const appended = (items as UserForumAnswer[]).filter(

        (item) => !existing.has(item.id),

      );

      this.userAnswers.update((current) => [...current, ...appended]);

      return;

    }



    const targetSignal =

      type === 'experiences' ? this.userExperiences : this.userQuestions;

    const existing = new Set(targetSignal().map((item) => item.id));

    const appended = (items as UserForumQuestion[]).filter(

      (item) => !existing.has(item.id),

    );

    targetSignal.update((current) => [...current, ...appended]);

  }



  openForumTopic(threadId: string | null | undefined) {

    if (!threadId) return;

    this.router.navigate(['/forums/topic', threadId]);

  }



  truncateText(text: string, maxLength = 120): string {

    const normalized = text?.trim() ?? '';

    if (normalized.length <= maxLength) return normalized;

    return `${normalized.slice(0, maxLength).trim()}…`;

  }



  private applyProfile(user: any) {

    if (!user) return;



    const rawImage =

      (user.profileImageRaw ?? user.profileImage ?? null) as string | null;

    const image =

      typeof rawImage === 'string' && rawImage.trim()

        ? this.imageUrlService.getImageUrl(rawImage)

        : null;



    if (image !== this.avatarSrc) {

      this.avatarSkeleton = true;

      this.avatarSrc = image ?? '';

    }



    this.userSession.mergeIntoStoredUser({

      ...user,

      profileImage: typeof rawImage === 'string' ? rawImage : user.profileImage,

    });

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

        const resolved = this.imageUrlService.getImageUrl(res.url);

        this.avatarSrc = resolved;

        this.avatarSkeleton = false;

        this.isUploadingAvatar = false;

        this.userSession.mergeIntoStoredUser({ profileImage: res.url });

        this.profileCompletion.updateUserData({

          ...this.profileCompletion.currentUserData,

          profileImage: resolved,

          profileImageRaw: res.url,

        });

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



  isPlanningStatusPending(): boolean {
    return this.cycleSettings.getPregnantProfileCardPending();
  }

  isStatusSelected(s: string) {
    return isReproductiveUiStatusSelected(
      this.currentReproductiveStatus,
      s,
      { planningPending: this.isPlanningStatusPending() },
    );
  }


  syncStatusFromApi() {

    const apiStatus = this.profileCompletion.currentUserData?.status;

    this.currentReproductiveStatus = this.normalizeStatus(apiStatus);

  }



  private normalizeStatus(s: string | null): string | null {
    return normalizeReproductiveUiStatus(s);
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

      return;

    }



    if (status === 'MENOPAUSE') {

      await this.openMenopauseSetupSheet(status);

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



  private async openMenopauseSetupSheet(uiStatus: string): Promise<void> {

    const modal = await this.modalCtrl.create({

      component: MenopauseSetupSheetComponent,

      breakpoints: [0, 0.75, 1],

      initialBreakpoint: 0.75,

      backdropDismiss: true,

      cssClass: 'menopause-setup-sheet',

    });



    await modal.present();



    const { data, role } =

      await modal.onWillDismiss<MenopauseSetupSheetResult>();



    if (role !== 'confirm' || !data) {

      return;

    }



    const userId = this.userInfoStore?.user?.id;

    if (!userId) {

      this.showToast(this.translation.translate('profile.toast.userIdMissing'));

      return;

    }



    const payload: UpdateReproductiveStateDto = {

      state: 'menopause',

      menopauseStage: data.menopauseStage,

    };

    if (data.lastPeriodDate) {

      payload.lastPeriodDate = data.lastPeriodDate;

    }



    this.reproductiveStatus.updateState(userId, payload).subscribe({

      next: (dashboard: DashboardResponse) => {

        this.cycleSettings.applyMenopauseHomeMode(data.menopauseStage);

        if (data.lastPeriodDate) {

          this.cycleSettings.setLastPeriodStart(data.lastPeriodDate);

        }

        this.finishReproductiveStatusSave(uiStatus, dashboard);

      },

      error: () =>

        this.showToast(this.translation.translate('profile.toast.statusUpdateFailed')),

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

    this.cycleSettings.setMenopauseStatus(false);



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

    if (uiStatus === 'MENOPAUSE') {

      this.applyLocalMenopauseSettingsFromDashboard(dashboard);

    }

    this.pushHomeJourneyFromDashboard(dashboard);

    this.profileCompletion.refreshFromAPI().subscribe();

    if (uiStatus === 'MENOPAUSE') {

      void this.showToast(this.translation.translate('profile.toast.menopauseSaved'));

    }

    this.router.navigate(['/tabs/home'], { replaceUrl: true });

  }



  private applyLocalMenopauseSettingsFromDashboard(

    dashboard: DashboardResponse,

  ): void {

    const stage = dashboard.menopauseStage ?? 'perimenopause';

    this.cycleSettings.applyMenopauseHomeMode(stage);

    const lastIso = dashboard.lastPeriodDate ?? null;

    if (lastIso) {

      this.cycleSettings.setLastPeriodStart(lastIso);

    }

  }



  /** Mirror pregnancy dashboard locally so Home tab reflects mode before remote sync. */

  private applyLocalPregnancySettingsFromDashboard(

    dashboard: DashboardResponse,

  ): void {

    this.cycleSettings.setUserStatus('Pregnant');

    this.cycleSettings.setPregnancyStatus(true);

    this.cycleSettings.setPostpartumStatus(false);

    this.cycleSettings.setMenopauseStatus(false);

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


