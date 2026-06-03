import { inject, Injectable } from '@angular/core';
import { UserSessionService } from './user-session.service';

@Injectable({
  providedIn: 'root'
})
export class OnboardingStateService {
  private userSession = inject(UserSessionService);
  private readonly ONBOARDING_COMPLETED_KEY = 'onboarding_completed';
  private readonly USER_ID_KEY = 'user_id';

  /**
   * Check if onboarding has been completed for the current user
   */
  hasCompletedOnboarding(): boolean {
    const userId = this.getCurrentUserId();
    if (!userId) return false;
    
    const completedUsers = this.getCompletedUsers();
    return completedUsers.includes(userId);
  }

  /**
   * Mark onboarding as completed for the current user
   */
  markOnboardingCompleted(): void {
    const userId = this.getCurrentUserId();
    if (!userId) return;
    
    const completedUsers = this.getCompletedUsers();
    if (!completedUsers.includes(userId)) {
      completedUsers.push(userId);
      localStorage.setItem(this.ONBOARDING_COMPLETED_KEY, JSON.stringify(completedUsers));
    }
  }

  /**
   * Reset onboarding completion status (useful for testing or if user wants to redo onboarding)
   */
  resetOnboardingStatus(): void {
    const userId = this.getCurrentUserId();
    if (!userId) return;
    
    const completedUsers = this.getCompletedUsers();
    const filteredUsers = completedUsers.filter(id => id !== userId);
    localStorage.setItem(this.ONBOARDING_COMPLETED_KEY, JSON.stringify(filteredUsers));
  }

  private getCurrentUserId(): string | null {
    return this.userSession.getCurrentUserIdString();
  }

  /**
   * Get list of user IDs who have completed onboarding
   */
  private getCompletedUsers(): string[] {
    try {
      const completed = localStorage.getItem(this.ONBOARDING_COMPLETED_KEY);
      if (!completed) {
        return [];
      }
      // Guest completion uses the literal string `true` (see onboarding.component saveAnswers).
      if (completed === 'true') {
        return [];
      }

      const parsed = JSON.parse(completed);
      if (Array.isArray(parsed)) {
        return parsed.filter((id): id is string => typeof id === 'string');
      }

      console.warn('Invalid completed users data found, clearing...');
      localStorage.removeItem(this.ONBOARDING_COMPLETED_KEY);
      return [];
    } catch (error) {
      console.error('Error getting completed users:', error);
      localStorage.removeItem(this.ONBOARDING_COMPLETED_KEY);
      return [];
    }
  }

  /**
   * Check if user is authenticated (has userInfo in localStorage)
   */
  isUserAuthenticated(): boolean {
    return !!localStorage.getItem('userInfo');
  }

}
