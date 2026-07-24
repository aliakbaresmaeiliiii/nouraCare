import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import {
  AdminHealthDto,
  AdminMeDto,
  AdminOverviewDto,
  AdminSubscriptionSummaryDto,
  AdminUsersPageDto,
  ApiEnvelope,
} from '../models/admin-api.models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiEndPoint}admin`;

  private unwrap<T>(res: ApiEnvelope<T>): T {
    if (res?.data === undefined || res?.data === null) {
      throw new Error(res?.message || 'Invalid API response');
    }
    return res.data;
  }

  getMe(): Observable<AdminMeDto> {
    return this.http
      .get<ApiEnvelope<AdminMeDto>>(`${this.base}/me`)
      .pipe(map((res) => this.unwrap(res)));
  }

  getOverview(): Observable<AdminOverviewDto> {
    return this.http
      .get<ApiEnvelope<AdminOverviewDto>>(`${this.base}/dashboard/overview`)
      .pipe(map((res) => this.unwrap(res)));
  }

  listUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  } = {}): Observable<AdminUsersPageDto> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', String(query.page));
    if (query.limit) params = params.set('limit', String(query.limit));
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);
    if (query.role) params = params.set('role', query.role);
    return this.http
      .get<ApiEnvelope<AdminUsersPageDto>>(`${this.base}/users`, { params })
      .pipe(map((res) => this.unwrap(res)));
  }

  updateUser(
    id: number,
    body: { status?: string; role?: string },
  ): Observable<unknown> {
    return this.http
      .patch<ApiEnvelope<unknown>>(`${this.base}/users/${id}`, body)
      .pipe(map((res) => this.unwrap(res)));
  }

  getSubscriptionSummary(): Observable<AdminSubscriptionSummaryDto> {
    return this.http
      .get<ApiEnvelope<AdminSubscriptionSummaryDto>>(
        `${this.base}/subscriptions/summary`,
      )
      .pipe(map((res) => this.unwrap(res)));
  }

  getHealth(): Observable<AdminHealthDto> {
    return this.http
      .get<ApiEnvelope<AdminHealthDto>>(`${this.base}/health`)
      .pipe(map((res) => this.unwrap(res)));
  }
}
