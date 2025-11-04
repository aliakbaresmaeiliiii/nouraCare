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

@Injectable({
  providedIn: 'root'
})
export class OnboardingService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiEndPoint + 'onboarding';


  startOnboarding(): Observable<OnboardingSession> {
    return this.http.post<OnboardingSession>(`${this.baseUrl}/start`, {});
  }
  /**
   * Save temporary onboarding data
   * @param onboardingData The onboarding data to save
   * @returns Observable with session information
   */
 
  saveOnboardingData(onboardingData: OnboardingDataDto): Observable<OnboardingSessionResponse> {
    debugger
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
}
