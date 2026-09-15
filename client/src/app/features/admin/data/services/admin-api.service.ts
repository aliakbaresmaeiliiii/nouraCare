import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';
import {
  AdminHealthDto,
  AdminMeDto,
  AdminOverviewDto,
  AdminSubscriptionSummaryDto,
  AdminApiUser,
  AdminUserCreateBody,
  AdminUserUpdateBody,
  AdminUsersPageDto,
  AdminTicketDetail,
  AdminTicketsPageDto,
  AdminTicketUpdateBody,
  AdminApiDoctor,
  AdminDoctorCreateBody,
  AdminDoctorDetail,
  AdminDoctorUpdateBody,
  AdminDoctorsPageDto,
  AdminAppointmentItem,
  AdminAppointmentsPageDto,
  AdminAppointmentUpdateBody,
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

  getUser(id: number): Observable<AdminApiUser> {
    return this.http
      .get<ApiEnvelope<AdminApiUser>>(`${this.base}/users/${id}`)
      .pipe(map((res) => this.unwrap(res)));
  }

  createUser(body: AdminUserCreateBody): Observable<AdminApiUser> {
    return this.http
      .post<ApiEnvelope<AdminApiUser>>(`${this.base}/users`, body)
      .pipe(map((res) => this.unwrap(res)));
  }

  updateUser(id: number, body: AdminUserUpdateBody): Observable<AdminApiUser> {
    return this.http
      .patch<ApiEnvelope<AdminApiUser>>(`${this.base}/users/${id}`, body)
      .pipe(map((res) => this.unwrap(res)));
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<ApiEnvelope<unknown>>(`${this.base}/users/${id}`).pipe(
      map((res) => {
        if (res && res.isSuccess === false) {
          throw new Error(res.message || 'Delete failed');
        }
      }),
    );
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

  listTickets(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    category?: string;
  } = {}): Observable<AdminTicketsPageDto> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', String(query.page));
    if (query.limit) params = params.set('limit', String(query.limit));
    if (query.search) params = params.set('search', query.search);
    if (query.status) params = params.set('status', query.status);
    if (query.category) params = params.set('category', query.category);
    return this.http
      .get<ApiEnvelope<AdminTicketsPageDto>>(`${this.base}/tickets`, { params })
      .pipe(map((res) => this.unwrap(res)));
  }

  getTicket(id: string): Observable<AdminTicketDetail> {
    return this.http
      .get<ApiEnvelope<AdminTicketDetail>>(`${this.base}/tickets/${id}`)
      .pipe(map((res) => this.unwrap(res)));
  }

  updateTicket(
    id: string,
    body: AdminTicketUpdateBody,
  ): Observable<AdminTicketDetail> {
    return this.http
      .patch<ApiEnvelope<AdminTicketDetail>>(`${this.base}/tickets/${id}`, body)
      .pipe(map((res) => this.unwrap(res)));
  }

  replyTicket(id: string, body: string): Observable<AdminTicketDetail> {
    return this.http
      .post<ApiEnvelope<AdminTicketDetail>>(
        `${this.base}/tickets/${id}/messages`,
        { body },
      )
      .pipe(map((res) => this.unwrap(res)));
  }

  listDoctors(query: {
    page?: number;
    limit?: number;
    search?: string;
    verified?: boolean;
  } = {}): Observable<AdminDoctorsPageDto> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', String(query.page));
    if (query.limit) params = params.set('limit', String(query.limit));
    if (query.search) params = params.set('search', query.search);
    if (query.verified !== undefined) {
      params = params.set('verified', String(query.verified));
    }
    return this.http
      .get<ApiEnvelope<AdminDoctorsPageDto>>(`${this.base}/doctors`, { params })
      .pipe(map((res) => this.unwrap(res)));
  }

  getDoctor(id: string): Observable<AdminDoctorDetail> {
    return this.http
      .get<ApiEnvelope<AdminDoctorDetail>>(`${this.base}/doctors/${id}`)
      .pipe(map((res) => this.unwrap(res)));
  }

  createDoctor(body: AdminDoctorCreateBody): Observable<AdminApiDoctor> {
    return this.http
      .post<ApiEnvelope<AdminApiDoctor>>(`${this.base}/doctors`, body)
      .pipe(map((res) => this.unwrap(res)));
  }

  updateDoctor(
    id: string,
    body: AdminDoctorUpdateBody,
  ): Observable<AdminApiDoctor> {
    return this.http
      .patch<ApiEnvelope<AdminApiDoctor>>(`${this.base}/doctors/${id}`, body)
      .pipe(map((res) => this.unwrap(res)));
  }

  deleteDoctor(id: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<unknown>>(`${this.base}/doctors/${id}`)
      .pipe(
        map((res) => {
          if (res && res.isSuccess === false) {
            throw new Error(res.message || 'Delete failed');
          }
        }),
      );
  }

  listAppointments(query: {
    page?: number;
    limit?: number;
    status?: string;
    consultationType?: string;
    doctorId?: string;
    search?: string;
  } = {}): Observable<AdminAppointmentsPageDto> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', String(query.page));
    if (query.limit) params = params.set('limit', String(query.limit));
    if (query.status) params = params.set('status', query.status);
    if (query.consultationType) {
      params = params.set('consultationType', query.consultationType);
    }
    if (query.doctorId) params = params.set('doctorId', query.doctorId);
    if (query.search) params = params.set('search', query.search);
    return this.http
      .get<ApiEnvelope<AdminAppointmentsPageDto>>(`${this.base}/appointments`, {
        params,
      })
      .pipe(map((res) => this.unwrap(res)));
  }

  updateAppointment(
    id: string,
    body: AdminAppointmentUpdateBody,
  ): Observable<AdminAppointmentItem> {
    return this.http
      .patch<ApiEnvelope<AdminAppointmentItem>>(
        `${this.base}/appointments/${id}`,
        body,
      )
      .pipe(map((res) => this.unwrap(res)));
  }
}
