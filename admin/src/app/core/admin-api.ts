import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api';

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardOverview {
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
  subscriptions: { byTier: Record<string, number> };
  reproductive: { byState: Record<string, number> };
  doctors: { total: number; verified: number; unverified: number };
  appointments: { total: number; pending: number };
  community: { threads: number; posts: number; secretChats: number };
  charts: { signupsLast7Days: { day: string; count: number }[] };
  recentSignups: Array<{
    id: number;
    fullName: string;
    email: string;
    status: string;
    createdAt: string;
    isVerified: boolean;
  }>;
}

export interface AdminUserRow {
  id: number;
  email: string;
  phoneNumber: string;
  fullName: string;
  role: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user_subscription?: {
    tier: string;
    premiumUntil?: string | null;
    trialEndsAt?: string | null;
  } | null;
  user_engagement?: {
    engagementScore: number;
    engagementTier: string;
    lastOpenAt?: string | null;
    growthPoints: number;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly api = inject(ApiService);

  overview(): Observable<DashboardOverview> {
    return this.api.get<DashboardOverview>('/admin/dashboard/overview');
  }

  listUsers(query: Record<string, string | number | undefined>): Observable<Paginated<AdminUserRow>> {
    return this.api.get<Paginated<AdminUserRow>>('/admin/users', query);
  }

  getUser(id: number): Observable<AdminUserRow> {
    return this.api.get<AdminUserRow>(`/admin/users/${id}`);
  }

  updateUser(id: number, body: { status?: string; role?: string }): Observable<AdminUserRow> {
    return this.api.patch<AdminUserRow>(`/admin/users/${id}`, body);
  }

  listDoctors(query: Record<string, string | number | boolean | undefined>) {
    return this.api.get<Paginated<any>>('/admin/doctors', query);
  }

  updateDoctor(id: string, body: { isVerified?: boolean }) {
    return this.api.patch(`/admin/doctors/${id}`, body);
  }

  listAppointments(query: Record<string, string | number | undefined>) {
    return this.api.get<Paginated<any>>('/admin/appointments', query);
  }

  listThreads(query: Record<string, string | number | undefined>) {
    return this.api.get<Paginated<any>>('/admin/forums/threads', query);
  }

  updateThread(id: string, body: { isPinned?: boolean; isLocked?: boolean }) {
    return this.api.patch(`/admin/forums/threads/${id}`, body);
  }

  deleteThread(id: string) {
    return this.api.delete(`/admin/forums/threads/${id}`);
  }

  subscriptionSummary() {
    return this.api.get<{
      byTier: Record<string, number>;
      premiumActive: number;
      trialActive: number;
    }>('/admin/subscriptions/summary');
  }
}
