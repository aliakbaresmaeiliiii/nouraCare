import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type SupportTicketStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'WAITING_ON_USER'
  | 'RESOLVED'
  | 'CLOSED';

export type SupportTicketCategory =
  | 'BUG'
  | 'QUESTION'
  | 'ACCOUNT'
  | 'PAYMENT'
  | 'FEEDBACK'
  | 'OTHER';

export type SupportTicketPriority = 'LOW' | 'NORMAL' | 'HIGH';

export interface SupportTicketMessage {
  id: string;
  authorId: number;
  authorRole: 'USER' | 'ADMIN';
  body: string;
  createdAt: string;
}

export interface SupportTicketListItem {
  id: string;
  subject: string;
  category: SupportTicketCategory;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview: {
    body: string;
    authorRole: 'USER' | 'ADMIN';
    createdAt: string;
  } | null;
}

export interface SupportTicketDetail extends SupportTicketListItem {
  appVersion?: string | null;
  deviceInfo?: string | null;
  pagePath?: string | null;
  messages: SupportTicketMessage[];
  canReply: boolean;
}

export interface SupportTicketsPage {
  items: SupportTicketListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateSupportTicketBody {
  subject: string;
  message: string;
  category?: SupportTicketCategory;
  appVersion?: string;
  deviceInfo?: string;
  pagePath?: string;
}

function unwrap<T>(body: unknown): T {
  const b = body as { data?: T };
  return (b?.data ?? body) as T;
}

@Injectable({ providedIn: 'root' })
export class SupportTicketService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiEndPoint}me/tickets`;

  list(query: {
    page?: number;
    limit?: number;
    status?: SupportTicketStatus;
  } = {}): Observable<SupportTicketsPage> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', String(query.page));
    if (query.limit) params = params.set('limit', String(query.limit));
    if (query.status) params = params.set('status', query.status);
    return this.http
      .get(`${this.base}`, { params })
      .pipe(map((r) => unwrap<SupportTicketsPage>(r)));
  }

  get(id: string): Observable<SupportTicketDetail> {
    return this.http
      .get(`${this.base}/${id}`)
      .pipe(map((r) => unwrap<SupportTicketDetail>(r)));
  }

  create(body: CreateSupportTicketBody): Observable<SupportTicketDetail> {
    return this.http
      .post(`${this.base}`, body)
      .pipe(map((r) => unwrap<SupportTicketDetail>(r)));
  }

  reply(id: string, body: string): Observable<SupportTicketDetail> {
    return this.http
      .post(`${this.base}/${id}/messages`, { body })
      .pipe(map((r) => unwrap<SupportTicketDetail>(r)));
  }
}
