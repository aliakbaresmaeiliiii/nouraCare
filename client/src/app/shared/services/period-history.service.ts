import { inject, Injectable } from '@angular/core';
import { CreatePeriodLogDto } from '../models/period-log.dto';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface PeriodHistoryEntry {
  /** First day of period (YYYY-MM-DD) */
  lastPeriodStartDate: string;
  /** When the user saved this entry */
  recordedAt: string;
}

const STORAGE_KEY = 'periodTrackingHistory';
const MAX_ENTRIES = 36;

@Injectable({ providedIn: 'root' })
export class PeriodHistoryService {
  apiUrl = environment.apiEndPoint + '/';

  http = inject(HttpClient);

  private parseEntries(raw: string | null): PeriodHistoryEntry[] {
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (e): e is PeriodHistoryEntry =>
          e &&
          typeof (e as PeriodHistoryEntry).lastPeriodStartDate === 'string' &&
          typeof (e as PeriodHistoryEntry).recordedAt === 'string'
      );
    } catch {
      return [];
    }
  }



  /** If the user has cycle data but no history yet, create one row so the list is not empty. */
  seedFromCurrentIfEmpty(lastPeriodStartDate: string): void {
    if (this.getEntries().length > 0) return;
    this.addEntry(lastPeriodStartDate);
  }

  getEntries(): PeriodHistoryEntry[] {
    try {
      return this.parseEntries(localStorage.getItem(STORAGE_KEY)).sort(
        (a, b) =>
          new Date(b.lastPeriodStartDate).getTime() -
          new Date(a.lastPeriodStartDate).getTime()
      );
    } catch {
      return [];
    }
  }

  /** Record a new period start; replaces any existing entry for the same calendar day. */
  addEntry(lastPeriodStartDate: string): void {
    const day = lastPeriodStartDate.split('T')[0];
    const now = new Date().toISOString();
    const existing = this.getEntries().filter((e) => {
      const d = e.lastPeriodStartDate.split('T')[0];
      return d !== day;
    });
    const next: PeriodHistoryEntry[] = [
      { lastPeriodStartDate: day, recordedAt: now },
      ...existing,
    ].slice(0, MAX_ENTRIES);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }
}
