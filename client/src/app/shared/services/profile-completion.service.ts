import { Injectable, signal, computed, inject } from '@angular/core';
import { ImageUrlService } from './image-url.service';
import { UserInfoService } from './user-info.service';
import { UserSessionService } from './user-session.service';
import { User } from './user';
import { OnboardingService } from './onboarding.service';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProfileCompletionService {
  private imageUrlService = inject(ImageUrlService);
  private userInfoService = inject(UserInfoService);
  private userSession = inject(UserSessionService);
  private userService = inject(User);
  private onboardingService = inject(OnboardingService);

  // Signal to store user data
  private userData = signal<any>({});
  private isLoading = signal<boolean>(false);

  // Computed signal for profile completion percentage
  public profileCompletion = computed(() => {
    const user = this.userData();
    const completion = this.computeProfileCompletion(user);
    return completion;
  });

  // Getter for loading state
  get loading() {
    return this.isLoading();
  }

  // Getter for current user data
  get currentUserData() {
    return this.userData();
  }

  // Individual field completion getters
  get isNameCompleted(): boolean {
    const user = this.userData();
    return !!(user?.name && user.name.trim() !== '');
  }

  get isEmailCompleted(): boolean {
    const user = this.userData();
    return !!(user?.email && user.email.trim() !== '');
  }

  get isBirthdayCompleted(): boolean {
    const user = this.userData();
    return !!(user?.birthday && user.birthday.trim() !== '');
  }

  get isProfileImageCompleted(): boolean {
    const user = this.userData();
    const raw = user?.profileImageRaw ?? user?.profileImage;
    return !!(
      typeof raw === 'string' &&
      raw.trim() !== '' &&
      !raw.startsWith('blob:') &&
      !raw.startsWith('data:')
    );
  }

  get isStatusCompleted(): boolean {
    const user = this.userData();
    return !!(user?.status && user.status.trim() !== '');
  }

  get isCycleLengthCompleted(): boolean {
    const user = this.userData();
    return !!(user?.menstrualCycleLength && user.menstrualCycleLength > 0);
  }

  get isPeriodDurationCompleted(): boolean {
    const user = this.userData();
    return !!(user?.periodDuration && user.periodDuration > 0);
  }

  get isLastPeriodCompleted(): boolean {
    const user = this.userData();
    return !!(
      user?.lastPeriodStartDate && user.lastPeriodStartDate.trim() !== ''
    );
  }

  // Method to update user data
  updateUserData(user: any) {
    this.userData.set(user);
  }

  /** Unwrap GET /user body: { data: user } or raw user; ignore { data: null } from catchError. */
  private extractUserPayload(res: any): any {
    if (!res || typeof res !== 'object') return {};
    if (
      res.data != null &&
      typeof res.data === 'object' &&
      !Array.isArray(res.data)
    ) {
      return res.data;
    }
    if (res.id != null || res.email != null || res.fullName != null) {
      return res;
    }
    return {};
  }

  private extractOnboardingPayload(res: any): any {
    if (!res || typeof res !== 'object') return {};
    if (
      res.data != null &&
      typeof res.data === 'object' &&
      !Array.isArray(res.data)
    ) {
      return res.data;
    }
    return res;
  }

  /** Refreshes user + onboarding from API. Returns observable so only one subscriber triggers one request. */
  refreshFromAPI(): Observable<any> {
    this.isLoading.set(true);

    let userId = this.userSession.getCurrentUserId();
    if (!userId) {
      const info = this.userInfoService.getCurrentUserInfo();
      const raw = info?.data?.id ?? info?.user?.id ?? info?.userId;
      if (raw != null && raw !== '') {
        const n = Number(raw);
        if (Number.isFinite(n) && n > 0) {
          userId = n;
        }
      }
    }
    if (userId && !Number.isNaN(userId)) {
      return this.fetchUserDataFromAPI(userId);
    }
    this.isLoading.set(false);
    return of(null);
  }

  // Method to fetch user data from API (GET user/:id + onboarding)
  private fetchUserDataFromAPI(userId: number): Observable<any> {
    const userData$ = this.userService.getUser(String(userId)).pipe(
      catchError(() => of({ data: null })),
    );
    const onboardingData$ = this.onboardingService.getDashboard().pipe(
      catchError(() =>
        of({
          state: 'cycle',
          week: null,
          nextPeriod: null,
        }),
      ),
    );

    return forkJoin({
      userData: userData$,
      onboardingData: onboardingData$,
    }).pipe(
      map((data) => {
        const u = this.extractUserPayload(data.userData);
        const ob = this.extractOnboardingPayload(data.onboardingData);
        const fullName = u.fullName || u.name || '';
        const dobRaw = u.dateOfBirth ?? u.birthday;
        const dateOfBirth =
          dobRaw == null
            ? ''
            : typeof dobRaw === 'string'
              ? dobRaw.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? dobRaw.slice(0, 10)
              : new Date(dobRaw).toISOString().slice(0, 10);
        const profileImageRaw = (
          u.profileImage ??
          u.profile_img ??
          u.avatarUrl ??
          ''
        )
          .toString()
          .trim();
        // For <img src>: absolute URLs pass through ImageUrlService unchanged; relative paths get base URL.
        const profileImage = this.imageUrlService.getImageUrl(
          profileImageRaw || null,
        );
        return {
          name: fullName,
          fullName,
          email: u.email || '',
          birthday: dateOfBirth,
          dateOfBirth,
          profileImageRaw,
          profileImage,
          status: this.mapDashboardStateToStatus(ob.state) ?? u.status ?? null,
          city: u.city ?? '',
          menstrualCycleLength: 28,
          periodDuration: 5,
          lastPeriodStartDate: null,
        };
      }),
      tap({
        next: (merged) => {
          this.updateUserData(merged);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      }),
      catchError(() => {
        this.isLoading.set(false);
        return of(null);
      }),
    );
  }

  // Method to refresh from localStorage (fallback)
  refreshFromStorage() {
    const userInfoStore = this.userSession.getUserInfoStoreOrEmpty();
    const user = userInfoStore.user || {};
    this.updateUserData(user);
  }

  private computeProfileCompletion(user: any): number {
    // Calculate progress based on all profile fields from edit profile form
    const profileFields = [
      { value: user.name, weight: 20 }, // Name - 20%
      { value: user.email, weight: 20 }, // Email - 20%
      { value: user.birthday, weight: 15 }, // Birthday - 15%
      {
        value: user.profileImageRaw ?? user.profileImage,
        weight: 15,
      }, // Profile Image - 15% (raw API path, not placeholder avatar URL)
      // Additional fields from edit profile that we can check
      { value: user.status, weight: 10 }, // Status - 10%
      { value: user.menstrualCycleLength, weight: 5 }, // Cycle Length - 5%
      { value: user.periodDuration, weight: 5 }, // Period Duration - 5%
      { value: user.lastPeriodStartDate, weight: 10 }, // Last Period Start - 10%
    ];
    let totalProgress = 0;
    let totalWeight = 0;

    profileFields.forEach((field) => {
      totalWeight += field.weight;
      if (
        field.value &&
        field.value !== '' &&
        field.value !== null &&
        field.value !== undefined
      ) {
        totalProgress += field.weight;
      }
    });

    return Math.round((totalProgress / totalWeight) * 100);
  }

  private mapDashboardStateToStatus(
    state: string | null | undefined,
  ): string | null {
    if (!state) return null;
    if (state === 'pregnant') return 'PREGNANT';
    if (state === 'planning') return 'PLANNING_PREGNANCY';
    if (state === 'postpartum') return 'POSTPARTUM';
    if (state === 'cycle') return 'NOT_PREGNANT';
    return null;
  }
}
