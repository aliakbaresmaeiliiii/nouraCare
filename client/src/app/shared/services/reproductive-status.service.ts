import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { addCalendarDaysIso, isoDateOnly } from '../utils/pregnancy-lmp.util';

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

@Injectable({
  providedIn: 'root',
})
export class ReproductiveStatusService {
  http = inject(HttpClient);
  private baseUrl = environment.apiEndPoint + 'profile';

  updateReproductiveStatus(userId: number, data: ReproductiveStatusData): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${userId}/update-pregnancy-planning`, data);
  }

  getReproductiveStatus(id?: number): Observable<ReproductiveStatusData> {
    const url = id 
      ? `${this.baseUrl}/${id}/pregnancy-planning`
      : `${this.baseUrl}/pregnancy-planning`;
    return this.http.get<ReproductiveStatusData>(url);
  }

  getCycleCalendar(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/cycle-calendar`);
  }

  // Create pregnancy planning
  createPregnancyPlanning(
    userId:number,
    data: CreatePregnancyPlanningDto,
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
    cycleLength: number,
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
}
