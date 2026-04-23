import { Injectable, signal } from '@angular/core';
import { normalizeLmpInput } from '../utils/pregnancy-lmp.util';

@Injectable({ providedIn: 'root' })
export class CycleSettingsService {
  private readonly storageKey = 'cycleSettings';

  cycleLength = signal<number>(28);
  periodLength = signal<number>(5);
  lastPeriodStartDate = signal<string | null>(null);
  userStatus = signal<string>('Not Set');
  isPregnant = signal<boolean>(false);
  isPostpartum = signal<boolean>(false);
  pregnancyWeek = signal<number>(0);
  pregnancyProgress = signal<number>(0);
  /** Optional focused cycle day (YYYY-MM-DD) selected by user in cycle strip. */
  selectedCycleViewDate = signal<string | null>(null);

  constructor() {
    this.loadFromStorage();
  }

  setCycleLength(value: number) {
    this.cycleLength.set(Math.max(21, Math.min(60, Math.floor(value || 28))));
    this.saveToStorage();
  }

  setPeriodLength(value: number) {
    this.periodLength.set(Math.max(1, Math.min(10, Math.floor(value || 5))));
    this.saveToStorage();
  }

  setLastPeriodStart(dateIso: string | null) {
    const canonical = dateIso == null || dateIso === '' ? null : normalizeLmpInput(dateIso);
    this.lastPeriodStartDate.set(canonical);
    this.saveToStorage();
  }

  setUserStatus(status: string) {
    this.userStatus.set(status);
    this.saveToStorage();
  }

  setPregnancyStatus(isPregnant: boolean) {
    this.isPregnant.set(isPregnant);
    this.saveToStorage();
  }

  setPostpartumStatus(isPostpartum: boolean) {
    this.isPostpartum.set(isPostpartum);
    this.saveToStorage();
  }

  setPregnancyWeek(week: number) {
    this.pregnancyWeek.set(Math.max(0, Math.min(45, Math.floor(week || 0))));
    this.saveToStorage();
  }

  setPregnancyProgress(progress: number) {
    const p = Number.isFinite(progress) ? progress : 0;
    this.pregnancyProgress.set(Math.max(0, Math.min(100, Math.round(p))));
    this.saveToStorage();
  }

  setSelectedCycleViewDate(dateIso: string | null) {
    this.selectedCycleViewDate.set(dateIso ?? null);
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.cycleLength === 'number') this.cycleLength.set(data.cycleLength);
      if (typeof data.periodLength === 'number') this.periodLength.set(data.periodLength);
      if (typeof data.lastPeriodStartDate === 'string' || data.lastPeriodStartDate === null) {
        this.lastPeriodStartDate.set(
          data.lastPeriodStartDate ? normalizeLmpInput(data.lastPeriodStartDate) : null,
        );
      }
      if (typeof data.userStatus === 'string') this.userStatus.set(data.userStatus);
      if (typeof data.isPregnant === 'boolean') this.isPregnant.set(data.isPregnant);
      if (typeof data.isPostpartum === 'boolean') this.isPostpartum.set(data.isPostpartum);
      if (typeof data.pregnancyWeek === 'number') this.pregnancyWeek.set(data.pregnancyWeek);
      if (typeof data.pregnancyProgress === 'number') this.pregnancyProgress.set(data.pregnancyProgress);
    } catch {}
  }

  private saveToStorage() {
    try {
      const data = {
        cycleLength: this.cycleLength(),
        periodLength: this.periodLength(),
        lastPeriodStartDate: this.lastPeriodStartDate(),
        userStatus: this.userStatus(),
        isPregnant: this.isPregnant(),
        isPostpartum: this.isPostpartum(),
        pregnancyWeek: this.pregnancyWeek(),
        pregnancyProgress: this.pregnancyProgress(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {}
  }
}
