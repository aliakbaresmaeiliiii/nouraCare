import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


export interface OnboardingSession {
  sessionId: string;
  expiresAt: string;
}
export interface OnboardingDataDto {
  pregnancy_status: string;
  /** Canonical LMP (first day of last period), `YYYY-MM-DD`. Same as `last_period` when set. */
  lmp_date?: string | null;
  last_period: string | null;
  cycle_length: number;
  period_length: number;
  pregnancy_week?: number;
  health_goals: string;
  notifications: string;
}

export interface OnboardingSessionResponse {
  sessionId: string;
  message: string;
}

export interface OnboardingDataResponse {
  sessionId: string;
  data: OnboardingDataDto;
  createdAt: string;
}

export interface CompleteOnboardingResponse {
  success: boolean;
  message: string;
  userId?: string;
  accessToken?: string;
}

export type ReproductiveState = 'cycle' | 'planning' | 'pregnant' | 'postpartum';

export interface InitializeReproductiveStateDto {
  state: ReproductiveState;
  pregnancyStartDate?: string;
  pregnancyDueDate?: string;
  tryingSince?: string;
  notes?: string;
  lastPeriodDate?: string;
  cycleLength?: number;
  currentWeek?: number;
}

export interface DashboardFertileWindow {
  start: string;
  end: string;
}

export interface DashboardResponse {
  state: ReproductiveState;
  week: number | null;
  /** Day within current pregnancy week (0–6); aligned with 1-based `week` from LMP. */
  day?: number | null;
  /** Progress through a 280-day model, 0–1. */
  progress?: number | null;
  tips: string[];
  nextPeriod: string | null;
  /** Current cycle day (1-based) when cycle/planning/postpartum; from last period start. */
  cycleDay?: number | null;
  /** Predicted ovulation (ISO date), luteal model: nextPeriod − 14 days. */
  ovulationDate?: string | null;
  /** Fertile window; widened when cycle length variability is high. */
  fertileWindow?: DashboardFertileWindow | null;
  /** Heuristic 0–1 from regularity + symptom hints (not medical certainty). */
  confidence?: number | null;
  /** Short adaptive explanation for cycle/planning/postpartum. */
  insight?: string | null;
  avgCycleLength?: number | null;
  avgPeriodLength?: number | null;
  /** Alias for predicted average cycle length on dashboard (cycle/planning/postpartum). */
  cycleLength?: number | null;
  tryingSince?: string | null;
  notes?: string | null;
  /** True when state is pregnant but LMP has not been saved yet. */
  needsPregnancyInput?: boolean;
  /** LMP stored on the server (ISO date), when pregnant and known. */
  lastMenstrualPeriod?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiEndPoint + 'onboarding';
  private meBaseUrl = environment.apiEndPoint + 'me';

  startOnboarding(): Observable<OnboardingSession> {
    return this.http.post<OnboardingSession>(`${this.baseUrl}/start`, {});
  }
  /**
   * Save temporary onboarding data
   * @param onboardingData The onboarding data to save
   * @returns Observable with session information
   */
 
  saveOnboardingData(onboardingData: OnboardingDataDto): Observable<OnboardingSessionResponse> {
    return this.http.post<OnboardingSessionResponse>(`${this.baseUrl}/save`, onboardingData);
  }

  /**
   * Get temporary onboarding data by session ID
   * @param sessionId The session ID to retrieve data for
   * @returns Observable with onboarding data
   */
  getOnboardingData(sessionId: string): Observable<OnboardingDataResponse> {
    return this.http.get<OnboardingDataResponse>(`${this.baseUrl}/${sessionId}`);
  }

  /**
   * Complete onboarding with user registration
   * @param sessionId The session ID
   * @param email User's email
   * @param phone User's phone number
   * @returns Observable with completion response
   */
  completeOnboarding(sessionId: string, email: string, phone: string): Observable<CompleteOnboardingResponse> {
    return this.http.post<CompleteOnboardingResponse>(`${this.baseUrl}/${sessionId}/complete`, {
      email,
      phone
    });
  }

  /**
   * Generate a unique session ID for temporary storage
   * @returns A unique session ID
   */
  generateSessionId(): string {
    return 'onboarding_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Save session ID to localStorage for persistence
   * @param sessionId The session ID to save
   */
  saveSessionId(sessionId: string): void {
    localStorage.setItem('onboarding_session_id', sessionId);
  }

  /**
   * Get session ID from localStorage
   * @returns The saved session ID or null if not found
   */
  getSessionId(): string | null {
    return localStorage.getItem('onboarding_session_id');
  }

  /**
   * Clear session ID from localStorage
   */
  clearSessionId(): void {
    localStorage.removeItem('onboarding_session_id');
  }

  initializeReproductiveState(
    payload: InitializeReproductiveStateDto,
  ): Observable<DashboardResponse> {
    return this.http.post<DashboardResponse>(this.baseUrl, payload);
  }

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.meBaseUrl}/dashboard`);
  }

  updateReproductiveState(
    payload: InitializeReproductiveStateDto,
  ): Observable<DashboardResponse> {
    return this.http.patch<DashboardResponse>(`${this.meBaseUrl}/state`, payload);
  }
}
