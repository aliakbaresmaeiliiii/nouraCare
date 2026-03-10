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
    return !!(user?.profileImage && user.profileImage.trim() !== '');
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

    try {
      const userInfoData = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const userId = userInfoData.user?.id;
      if (userId) {
        return this.fetchUserDataFromAPI(userId);
      }
      this.isLoading.set(false);
      return of(null);
    } catch {
      this.isLoading.set(false);
      return of(null);
    }
  }

  // Method to fetch user data from API (single request for user + onboarding)
  private fetchUserDataFromAPI(userId: number): Observable<any> {
    const userData$ = this.userService.getUser(String(userId));
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
      map((data) => ({
        name: data.userData?.name || '',
        email: data.userData?.email || '',
        birthday: data.userData?.birthday || '',
        profileImage: data.userData?.profileImage || '',
        status: data.userData?.status || null,
        city: data.userData?.city ?? '',
        menstrualCycleLength: data.onboardingData?.cycleLength || 28,
        periodDuration: data.onboardingData?.periodLength || 5,
        lastPeriodStartDate: data.onboardingData?.lastPeriodDate || null,
      })),
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
      { value: user.profileImage, weight: 15 }, // Profile Image - 15%
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
