import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CycleSettingsService {
  private readonly storageKey = 'cycleSettings';

  cycleLength = signal<number>(28);
  periodLength = signal<number>(5);
  lastPeriodStartDate = signal<string | null>(null);

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
    this.lastPeriodStartDate.set(dateIso);
    this.saveToStorage();
  }

  private loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (typeof data.cycleLength === 'number') this.cycleLength.set(data.cycleLength);
      if (typeof data.periodLength === 'number') this.periodLength.set(data.periodLength);
      if (typeof data.lastPeriodStartDate === 'string' || data.lastPeriodStartDate === null) {
        this.lastPeriodStartDate.set(data.lastPeriodStartDate);
      }
    } catch {}
  }

  private saveToStorage() {
    try {
      const data = {
        cycleLength: this.cycleLength(),
        periodLength: this.periodLength(),
        lastPeriodStartDate: this.lastPeriodStartDate(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {}
  }
}


