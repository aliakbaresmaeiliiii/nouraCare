import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { addCalendarDaysIso, isoDateOnly } from '@app/shared/utils/pregnancy-lmp.util';
import { UpdateReproductiveStateDto } from '@app/features/profile/models/UpdateReproductiveStateDto';
import { OnboardingService, type DashboardResponse } from '@app/shared/services/onboarding.service';
import { UserInfoService } from '@app/shared/services/user-info.service';

export interface ReproductiveStatusData {
  isPregnant?: boolean;
  pregnancyEndDate?: string;
  averagePeriodDuration?: number;
  lastPeriodDate?: string;
  cycleLength?: number;
  mood?: string;
  notes?: string;
}

export interface CreatePregnancyPlanningDto {
  lastPeriodDate: string;
  cycleLength: number;
  averagePeriodDuration: number;
  lifestyleGoals?: string;
  notes?: string;
}

export interface PregnancyPlanningResponseDto {
  id: number;
  userId: number;
  lastPeriodDate: Date;
  cycleLength: number;
  lifestyleGoals?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Calculated fields
  ovulationDate?: Date;
  fertileWindow?: {
    start: Date;
    end: Date;
  };
  nextPeriodDate?: Date;
  pregnancyProbability?: number;
}

export interface PeriodLogData {
  lastPeriodDate: string;
  mood: string;
  notes: string;
  averagePeriodDuration: number;
}

export interface PeriodLogResponseDto {
  id: number;
  userId: number;
  lastPeriodDate: string;
  mood?: string | null;
  notes?: string | null;
  averagePeriodDuration?: number | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReproductiveStatusService {
  http = inject(HttpClient);
  private onboardingService = inject(OnboardingService);
  private userInfoService = inject(UserInfoService);
  private baseUrl = environment.apiEndPoint + 'profile';
  private meBaseUrl = environment.apiEndPoint + 'me';

  updateReproductiveStatus(
    userId: number,
    data: ReproductiveStatusData
  ): Observable<any> {
    const payload: Record<string, unknown> = {};

    if (data.pregnancyEndDate) {
      payload['state'] = 'postpartum';
      payload['notes'] = data.notes ?? undefined;
    } else if (typeof data.isPregnant === 'boolean') {
      payload['state'] = data.isPregnant ? 'pregnant' : 'cycle';
    } else {
      payload['state'] = 'cycle';
    }

    if (data.lastPeriodDate) payload['lastPeriodDate'] = data.lastPeriodDate;
    if (typeof data.cycleLength === 'number')
      payload['cycleLength'] = data.cycleLength;
    if (data.notes) payload['notes'] = data.notes;

    return this.http
      .patch<any>(`${this.meBaseUrl}/${userId}/state`, payload)
      .pipe(map((res) => this.mapDashboardToReproductiveStatus(res)));
  }

  getReproductiveStatus(id?: number): Observable<ReproductiveStatusData> {
    return this.http
      .get<any>(`${this.meBaseUrl}/dashboard`)
      .pipe(map((res) => this.mapDashboardToReproductiveStatus(res)));
  }

  getCycleCalendar(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/cycle-calendar`);
  }

  // Create pregnancy planning
  createPregnancyPlanning(
    userId: number,
    data: CreatePregnancyPlanningDto
  ): Observable<PregnancyPlanningResponseDto> {
    return this.http.post<PregnancyPlanningResponseDto>(
      `${this.baseUrl}/${userId}/pregnancy-planning`,
      data
    );
  }

  private clampCycleLength(days: number): number {
    return Math.max(21, Math.min(60, Math.floor(Number(days)) || 28));
  }

  private utcDateFromIsoDateOnly(iso: string): Date {
    const head = isoDateOnly(iso);
    if (!head) {
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? new Date() : d;
    }
    const [y, m, day] = head.split('-').map((x) => parseInt(x, 10));
    return new Date(Date.UTC(y, m - 1, day));
  }

  /**
   * Next period start = first day of last period + cycle length (calendar days).
   * Uses UTC date-only math when `lastPeriodDate` is ISO `YYYY-MM-DD` (same idea as the server).
   */
  calculateNextPeriod(lastPeriodDate: string, cycleLength: number): Date {
    const cl = this.clampCycleLength(cycleLength);
    const iso = isoDateOnly(lastPeriodDate);
    if (iso) {
      return this.utcDateFromIsoDateOnly(addCalendarDaysIso(iso, cl));
    }
    const lastPeriod = new Date(lastPeriodDate);
    const nextPeriod = new Date(lastPeriod);
    nextPeriod.setDate(lastPeriod.getDate() + cl);
    return nextPeriod;
  }

  /**
   * Fixed luteal-phase model (same as server cycle prediction): ovulation ≈ 14 days before the next
   * expected period; fertile window ≈ five days before ovulation through the day after ovulation.
   */
  calculateOvulationDate(lastPeriodDate: string, cycleLength: number): Date {
    const cl = this.clampCycleLength(cycleLength);
    const iso = isoDateOnly(lastPeriodDate);
    if (iso) {
      const nextIso = addCalendarDaysIso(iso, cl);
      return this.utcDateFromIsoDateOnly(addCalendarDaysIso(nextIso, -14));
    }
    const nextPeriod = this.calculateNextPeriod(lastPeriodDate, cycleLength);
    const ovulation = new Date(nextPeriod);
    ovulation.setDate(nextPeriod.getDate() - 14);
    return ovulation;
  }

  calculateFertileWindow(
    lastPeriodDate: string,
    cycleLength: number
  ): { start: Date; end: Date } {
    const cl = this.clampCycleLength(cycleLength);
    const iso = isoDateOnly(lastPeriodDate);
    if (iso) {
      const nextIso = addCalendarDaysIso(iso, cl);
      const ovulationIso = addCalendarDaysIso(nextIso, -14);
      const startIso = addCalendarDaysIso(ovulationIso, -5);
      const endIso = addCalendarDaysIso(ovulationIso, 1);
      return {
        start: this.utcDateFromIsoDateOnly(startIso),
        end: this.utcDateFromIsoDateOnly(endIso),
      };
    }
    const ovulation = this.calculateOvulationDate(lastPeriodDate, cl);
    const fertileStart = new Date(ovulation);
    fertileStart.setDate(ovulation.getDate() - 5);
    const fertileEnd = new Date(ovulation);
    fertileEnd.setDate(ovulation.getDate() + 1);
    return { start: fertileStart, end: fertileEnd };
  }

  // Create period log
  createPeriodLog(userId: number, data: PeriodLogData): Observable<any> {
    return this.http.post<any>(
      `${environment.apiEndPoint}profile/${userId}/period-logs`,
      data
    );
  }

  updateState(
    userId: number,
    data: UpdateReproductiveStateDto
  ): Observable<DashboardResponse> {
    return this.http
      .patch<DashboardResponse>(
        `${environment.apiEndPoint}me/${userId}/state`,
        data,
      )
      .pipe(
        tap(() => {
          this.onboardingService.invalidateDashboardCache();
          this.userInfoService.invalidateOnboardingCache();
        }),
      );
  }

  private mapDashboardToReproductiveStatus(
    source: any
  ): ReproductiveStatusData {
    if (!source || typeof source !== 'object') {
      return {};
    }

    // Compatibility: if an old endpoint already returned the expected shape.
    if ('lastPeriodDate' in source || 'averagePeriodDuration' in source) {
      return source as ReproductiveStatusData;
    }

    const state = String(source.state ?? '').toLowerCase();
    return {
      isPregnant: state === 'pregnant',
      pregnancyEndDate:
        state === 'postpartum'
          ? source.pregnancyEndDate ?? source.nextPeriod ?? null
          : undefined,
      lastPeriodDate:
        source.lastMenstrualPeriod ??
        source.lastPeriodDate ??
        source.lastPeriodDateIso ??
        null,
      cycleLength: source.cycleLength ?? source.avgCycleLength ?? null,
      averagePeriodDuration:
        source.avgPeriodLength ?? source.periodLength ?? null,
      notes: source.notes ?? null,
    };
  }
}
