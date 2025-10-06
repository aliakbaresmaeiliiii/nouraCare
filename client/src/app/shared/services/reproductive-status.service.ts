import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ReproductiveStatusData {
  isPregnant?: boolean;
  pregnancyEndDate?: string;
  lastPeriodDate?: string;
  averageCycleLength?: number;
  mood?: string;
  notes?: string;
}

export interface CreatePregnancyPlanningDto {
  lastPeriodDate: string;
  cycleLength: number;
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

@Injectable({
  providedIn: 'root',
})
export class ReproductiveStatusService {
  http = inject(HttpClient);
  private baseUrl = environment.apiEndPoint + 'profile';

  updateReproductiveStatus(userId: number, data: ReproductiveStatusData): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${userId}/reproductive-status`, data);
  }

  getReproductiveStatus(id?: number): Observable<ReproductiveStatusData> {
    const url = id 
      ? `${this.baseUrl}/${id}/reproductive-status`
      : `${this.baseUrl}/reproductive-status`;
    return this.http.get<ReproductiveStatusData>(url);
  }

  getCycleCalendar(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/cycle-calendar`);
  }

  // Create pregnancy planning
  createPregnancyPlanning(
    data: CreatePregnancyPlanningDto,
    userId:number
  ): Observable<PregnancyPlanningResponseDto> {
    return this.http.post<PregnancyPlanningResponseDto>(
      `${this.baseUrl}/${userId}/pregnancy-planning`,
      data
    );
  }

  // Calculate next expected period date
  calculateNextPeriod(lastPeriodDate: string, cycleLength: number): Date {
    const lastPeriod = new Date(lastPeriodDate);
    const nextPeriod = new Date(lastPeriod);
    nextPeriod.setDate(lastPeriod.getDate() + cycleLength);
    return nextPeriod;
  }

  // Calculate fertile window
  calculateFertileWindow(
    lastPeriodDate: string,
    cycleLength: number
  ): { start: Date; end: Date } {
    const nextPeriod = this.calculateNextPeriod(lastPeriodDate, cycleLength);
    const fertileStart = new Date(nextPeriod);
    fertileStart.setDate(nextPeriod.getDate() - 14);
    const fertileEnd = new Date(fertileStart);
    fertileEnd.setDate(fertileStart.getDate() + 5);

    return { start: fertileStart, end: fertileEnd };
  }
}
