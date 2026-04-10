/**
 * API envelope from Nest {@link ApiResponseHelper}
 */
export interface ApiEnvelope<T> {
  isSuccess: boolean;
  data: T;
  message?: string;
  code?: number;
  timestamp?: string;
}

export type ServerPregnancyStatus =
  | 'PLANNING_PREGNANCY'
  | 'PREGNANT'
  | 'NOT_PLANNING'
  | 'HAS_CHILD'
  | 'POSTPARTUM';

/** Persisted onboarding / journey row (`onboarding_data`) */
export interface UserInfo {
  id: number;
  userId: number;
  pregnancyStatus: ServerPregnancyStatus | string;
  lastPeriodDate: string | Date | null;
  cycleLength: number;
  periodLength: number;
  pregnancyWeek?: number | null;
  pregnancyProgress?: string | null;
  healthGoals: string[];
  notificationsEnabled: boolean;
  isCompleted: boolean;
  onboardingStep: number;
  createdAt: string;
  updatedAt: string;
}
