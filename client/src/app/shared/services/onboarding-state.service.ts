import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class OnboardingStateService {
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

  /**
   * Get current user ID from localStorage
   */
  private getCurrentUserId(): string | null {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        return parsed.user?.id || parsed.id || null;
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
    return null;
  }

  /**
   * Get list of user IDs who have completed onboarding
   */
  private getCompletedUsers(): string[] {
    try {
      const completed = localStorage.getItem(this.ONBOARDING_COMPLETED_KEY);
      return completed ? JSON.parse(completed) : [];
    } catch (error) {
      console.error('Error getting completed users:', error);
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
