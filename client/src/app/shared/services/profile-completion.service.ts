import { Injectable, signal, computed, inject } from '@angular/core';
import { ImageUrlService } from './image-url.service';
import { UserInfoService } from './user-info.service';
import { User } from './user';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProfileCompletionService {
  private imageUrlService = inject(ImageUrlService);
  private userInfoService = inject(UserInfoService);
  private userService = inject(User);

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

  /** Refreshes user + onboarding from API. Returns observable so only one subscriber triggers one request. */
  refreshFromAPI(): Observable<any> {
    this.isLoading.set(true);

    const info = this.userInfoService.getCurrentUserInfo();
    let userId: number | undefined =
      info?.data?.id ?? info?.userId ?? undefined;
    if (!userId) {
      try {
        const parsed = JSON.parse(localStorage.getItem('userInfo') || '{}');
        const raw =
          parsed?.user?.id ?? parsed?.userId ?? parsed?.data?.id ?? parsed?.id;
        if (raw != null && raw !== '') {
          userId = Number(raw);
        }
      } catch {
        /* ignore */
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
    const onboardingData$ = this.userInfoService.getUserOnboardingData(userId).pipe(
      catchError(() =>
        of({
          cycleLength: 28,
          periodLength: 5,
          lastPeriodDate: null,
        }),
      ),
    );

    return forkJoin({
      userData: userData$,
      onboardingData: onboardingData$,
    }).pipe(
      map((data) => {
        const u = (data.userData as any)?.data ?? data.userData ?? {};
        const ob = (data.onboardingData as any)?.data ?? data.onboardingData ?? {};
        const fullName = u.fullName || u.name || '';
        const birthdayRaw = u.birthday;
        const birthday =
          birthdayRaw == null
            ? ''
            : typeof birthdayRaw === 'string'
              ? birthdayRaw
              : new Date(birthdayRaw).toISOString();
        // Raw URL from API (e.g. https://10.x.x.x:8080/uploads/profile/....jpg) — keep as returned.
        const profileImageRaw = (u.profileImage ?? '').toString().trim();
        // For <img src>: absolute URLs pass through ImageUrlService unchanged; relative paths get base URL.
        const profileImage = this.imageUrlService.getImageUrl(
          profileImageRaw || null,
        );
        return {
          name: fullName,
          fullName,
          email: u.email || '',
          birthday,
          profileImageRaw,
          profileImage,
          status: ob.pregnancyStatus ?? u.status ?? null,
          city: u.city ?? '',
          menstrualCycleLength: ob.cycleLength || 28,
          periodDuration: ob.periodLength || 5,
          lastPeriodStartDate: ob.lastPeriodDate ?? null,
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
    try {
      const userInfoStore = JSON.parse(
        localStorage.getItem('userInfo') || '{}',
      );
      const user = userInfoStore?.user || {};
      this.updateUserData(user);
    } catch (error) {
      this.updateUserData({});
    }
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
}
