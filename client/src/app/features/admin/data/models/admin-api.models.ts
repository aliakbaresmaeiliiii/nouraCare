export interface ApiEnvelope<T> {
  isSuccess: boolean;
  message?: string;
  data?: T;
  code?: number;
}

export interface AdminOverviewDto {
  users: {
    total: number;
    active: number;
    suspended: number;
    verified: number;
    admins: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    byStatus: Record<string, number>;
  };
  subscriptions: {
    byTier: Record<string, number>;
  };
  reproductive: {
    byState: Record<string, number>;
  };
  doctors: {
    total: number;
    verified: number;
    unverified: number;
  };
  appointments: {
    total: number;
    pending: number;
  };
  community: {
    threads: number;
    posts: number;
    secretChats: number;
  };
  charts: {
    signupsLast7Days: Array<{ day: string; count: number }>;
  };
  recentSignups: Array<{
    id: number;
    fullName: string | null;
    email: string | null;
    status: string;
    createdAt: string;
    isVerified: boolean;
  }>;
}

export interface AdminApiUser {
  id: number;
  email: string | null;
  phoneNumber: string | null;
  fullName: string | null;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user_subscription?: {
    tier: string;
    premiumUntil?: string | null;
    trialEndsAt?: string | null;
    billingInterval?: string | null;
  } | null;
  user_engagement?: {
    engagementScore?: number | null;
    engagementTier?: string | null;
    lastOpenAt?: string | null;
    growthPoints?: number | null;
  } | null;
  user_profile?: {
    bio?: string | null;
    avatarUrl?: string | null;
    profileImage?: string | null;
  } | null;
}

export interface AdminUsersPageDto {
  items: AdminApiUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminSubscriptionSummaryDto {
  byTier: Record<string, number>;
  premiumActive: number;
  trialActive: number;
}

export interface AdminHealthDto {
  status: 'healthy' | 'degraded' | 'down';
  database: 'up' | 'down';
  latencyMs?: number;
  uptimeSec: number;
  checkedAt: string;
}

export interface AdminMeDto {
  id: number;
  email: string;
  fullName: string;
  role: string;
  status: string;
}
