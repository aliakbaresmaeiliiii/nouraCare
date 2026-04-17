import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GrowthSummary {
  referralCode: string;
  growthPoints: number;
  checkInStreak: number;
  lastCheckInDayIso: string | null;
  checkedInToday: boolean;
  successfulReferrals: number;
}

export interface GrowthCheckInResult {
  checkedInToday: boolean;
  checkInStreak: number;
  growthPoints: number;
  alreadyCheckedIn: boolean;
}

export interface GrowthSharePayload {
  title: string;
  summaryBody: string;
  hashtags: string[];
  invitePath: string;
}

function unwrap<T>(body: unknown): T {
  const b = body as { data?: T };
  return (b?.data ?? body) as T;
}

@Injectable({ providedIn: 'root' })
export class GrowthService {
  private http = inject(HttpClient);
  private base = `${environment.apiEndPoint}me/growth`;

  getSummary(): Observable<GrowthSummary> {
    return this.http.get(`${this.base}/summary`).pipe(map((r) => unwrap<GrowthSummary>(r)));
  }

  checkIn(): Observable<GrowthCheckInResult> {
    return this.http.post(`${this.base}/check-in`, {}).pipe(map((r) => unwrap<GrowthCheckInResult>(r)));
  }

  getShareSummary(): Observable<GrowthSharePayload> {
    return this.http.get(`${this.base}/share-summary`).pipe(map((r) => unwrap<GrowthSharePayload>(r)));
  }

  /** Full invite URL for the current web origin. */
  buildInviteUrl(invitePath: string): string {
    if (typeof window === 'undefined') {
      return invitePath;
    }
    const origin = window.location.origin.replace(/\/$/, '');
    const path = invitePath.startsWith('/') ? invitePath : `/${invitePath}`;
    return `${origin}${path}`;
  }

  composeShareText(payload: GrowthSharePayload): string {
    const url = this.buildInviteUrl(payload.invitePath);
    const tags = (payload.hashtags || []).join(' ');
    return `${payload.summaryBody}\n\n${url}\n\n${tags}`.trim();
  }
}
