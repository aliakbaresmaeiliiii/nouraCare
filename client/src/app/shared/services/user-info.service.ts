import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { UserInfo } from '../interfaces/user-info-api.interface';
import { environment } from '../../../environments/environment';

export interface OnboardingData {
  pregnancy_status: string;
  last_period: string;
  cycle_length: number;
  period_length: number;
  pregnancy_week?: number;
  health_goals: string;
  notifications: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserInfoService {
  userInfo = signal<UserInfo | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Save onboarding data to user info table
   */
  saveOnboardingData(onboardingData: OnboardingData): Observable<UserInfo> {
    const userId = this.getCurrentUserId();
    const payload = this.transformOnboardingData(onboardingData);
    
    
    // Call the real API endpoint
    return this.http.post<UserInfo>(`${environment.apiEndPoint}user/${userId}/onboarding`, payload).pipe(
      tap((response) => {
        // Update the signal with the response
        this.userInfo.set(response);
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  /**
   * Persist pregnancy / reproductive status only (server: POST user/:id/onboarding).
   */
  savePregnancyStatus(userId: number, pregnancyStatus: string): Observable<UserInfo> {
    return this.http
      .post<UserInfo>(`${environment.apiEndPoint}user/${userId}/onboarding`, {
        pregnancyStatus,
      })
      .pipe(
        tap((response) => {
          this.userInfo.set(response);
        }),
        catchError((error) => {
          throw error;
        }),
      );
  }

  /**
   * Get user onboarding data
   */
  getUserOnboardingData(userId?: number): Observable<UserInfo> {
    const targetUserId = userId || this.getCurrentUserId();
    
    // Call the real API endpoint
    return this.http.get<UserInfo>(`${environment.apiEndPoint}user/${targetUserId}/onboarding`).pipe(
      tap((response) => {
        // Update the signal with the response
        this.userInfo.set(response);
      }),
      catchError((error) => {
        throw error;
      })
    );
  }

  /**
   * Get user info by user ID (legacy method - now uses getUserOnboardingData)
   */
  getUserInfo(userId: number): Observable<UserInfo> {
    return this.getUserOnboardingData(userId);
  }

  /**
   * Update user info
   */
  updateUserInfo(userInfo: UserInfo): Observable<UserInfo> {
    
    // For now, update localStorage as fallback
    // TODO: Create PUT endpoint for updating user info
    return new Observable(observer => {
      try {
        const updatedInfo = {
          ...userInfo,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('userInfo', JSON.stringify(updatedInfo));
        this.userInfo.set(updatedInfo);
        
        observer.next(updatedInfo);
        observer.complete();
      } catch (error) {
        observer.error(error);
      }
    });
  }

  /**
   * Get current user info from signal
   */
  getCurrentUserInfo(): any | null {
    return this.userInfo();
  }

  /**
   * Transform onboarding data to user info format
   */
  private transformOnboardingData(data: OnboardingData): Partial<UserInfo> {
    const pregnancyStatus = this.mapPregnancyStatus(data.pregnancy_status);
    const healthGoals = data.health_goals ? JSON.parse(data.health_goals) : [];
    
    return {
      pregnancyStatus,
      lastPeriodDate: data.last_period,
      cycleLength: data.cycle_length,
      periodLength: data.period_length,
      pregnancyWeek: data.pregnancy_week,
      pregnancyProgress: data.pregnancy_week ? (data.pregnancy_week / 40) * 100 : undefined,
      healthGoals,
      notificationsEnabled: data.notifications === 'yes'
    };
  }

  /**
   * Map pregnancy status string to enum
   */
  private mapPregnancyStatus(status: string): 'pregnant' | 'trying' | 'postpartum' | 'tracking' {
    switch (status) {
      case 'pregnant':
        return 'pregnant';
      case 'trying':
        return 'trying';
      case 'postpartum':
        return 'postpartum';
      case 'tracking':
        return 'tracking';
      default:
        return 'tracking';
    }
  }

  /**
   * Get current user ID from localStorage or auth service
   */
  private getCurrentUserId(): number {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        return parsed.userId || 1; // Default to 1 if no user ID
      }
    } catch (error) {
    }
    return 1; // Default user ID
  }

  /**
   * Clear user info (for logout)
   */
  clearUserInfo(): void {
    localStorage.removeItem('userInfo');
    this.userInfo.set(null);
  }

  /**
   * Check if user info exists
   */
  hasUserInfo(): boolean {
    return this.userInfo() !== null;
  }

  /**
   * Load user info on app initialization
   */
  loadUserInfoOnInit(): void {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        this.userInfo.set(parsed);
      } else {
        // Try to load from API if no local data
        const userId = this.getCurrentUserId();
        if (userId) {
          this.getUserOnboardingData(userId).subscribe({
            next: (data) => {
            },
            error: (error) => {
            }
          });
        }
      }
    } catch (error) {
    }
  }

  /**
   * Get user info summary for display
   */
  getUserInfoSummary(): string {
    const info = this.userInfo();
    if (!info) return 'No user info available';
    
    const status = info.pregnancyStatus.charAt(0).toUpperCase() + info.pregnancyStatus.slice(1);
    const cycle = `${info.cycleLength}-day cycle`;
    const period = `${info.periodLength}-day period`;
    
    return `${status} • ${cycle} • ${period}`;
  }

  /**
   * Test API connection
   */
  testApiConnection(): Observable<any> {
    const userId = this.getCurrentUserId();
    
    return this.http.get(`${environment.apiEndPoint}user/${userId}/onboarding`).pipe(
      tap((response) => {
      }),
      catchError((error) => {
        throw error;
      })
    );
  }
}
