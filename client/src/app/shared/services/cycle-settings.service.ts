import { inject, Injectable, signal } from '@angular/core';
import { normalizeLmpInput } from '@app/shared/utils/pregnancy-lmp.util';
import { ReproductiveStatusService } from '@app/shared/services/reproductive-status.service';

@Injectable({ providedIn: 'root' })
export class CycleSettingsService {
  private readonly storageKey = 'cycleSettings';
  

  reproductiveStatus = inject(ReproductiveStatusService)
  cycleLength = signal<number>(28);
  periodLength = signal<number>(5);
  lastPeriodStartDate = signal<string | null>(null);
  userStatus = signal<string>('Not Set');
  isPregnant = signal<boolean>(false);
  isPostpartum = signal<boolean>(false);
  isMenopause = signal<boolean>(false);
  menopauseStage = signal<'perimenopause' | 'menopause'>('perimenopause');
  pregnancyWeek = signal<number>(0);
  pregnancyProgress = signal<number>(0);
  /** Optional baby/child name for pregnancy tracking (local only). */
  babyName = signal<string>('');
  /** Optional focused cycle day (YYYY-MM-DD) selected by user in cycle strip. */
  selectedCycleViewDate = signal<string | null>(null);


  /**
   * Profile “Get pregnant” (PLANNING) card should stay highlighted after the intro flow completes
   * while GET dashboard/state may still say `cycle` until the backend syncs — cleared once server/Journey
   * reports planning, or when the user explicitly chooses Track cycle from Profile.
   */
  getPregnantProfileCardPending = signal(false);

  constructor() {
    this.loadFromStorage();
  }

  /** Mark Get-pregnant as the active Profile experience intent (persisted). */
  setGetPregnantProfileCardPending(value: boolean): void {
    this.getPregnantProfileCardPending.set(value);
    this.setUserStatus('NOT_PREGNANT')
    this.saveToStorage();
  }

  clearGetPregnantProfileCardPending(): void {
    this.getPregnantProfileCardPending.set(false);
    this.setUserStatus('Trying to Conceive');

    this.saveToStorage();
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
    const prev = this.lastPeriodStartDate();
    this.lastPeriodStartDate.set(canonical);
    // New / changed LMP — drop stale week-strip focus so the ring shows today (day 1…n).
    if (canonical !== prev) {
      this.selectedCycleViewDate.set(null);
    }
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

  setMenopauseStatus(isMenopause: boolean) {
    this.isMenopause.set(isMenopause);
    this.saveToStorage();
  }

  setMenopauseStage(stage: 'perimenopause' | 'menopause') {
    this.menopauseStage.set(stage);
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

  setBabyName(name: string) {
    this.babyName.set(String(name ?? '').trim());
    this.saveToStorage();
  }

  setSelectedCycleViewDate(dateIso: string | null) {
    this.selectedCycleViewDate.set(dateIso ?? null);
    this.saveToStorage();
  }

  /**
   * Focuses the home cycle SVG week strip on the next predicted ovulation calendar day
   * (approx. cycleDay = cycleLength − 14 from last period start; advances by full cycles until ≥ today).
   * Key format matches the week strip: `${year}-${monthIndex0to11}-${day}`.
   */
  pinSelectedViewToNextPredictedOvulation(): void {
    const startIso = this.lastPeriodStartDate();
    if (!startIso) {
      this.setSelectedCycleViewDate(null);
      return;
    }

    const safeCycleLength = Math.max(21, this.cycleLength() || 28);
    const ovulationCycleDay = Math.max(1, safeCycleLength - 14);
    const start = new Date(`${startIso}T12:00:00`);
    if (Number.isNaN(start.getTime())) {
      this.setSelectedCycleViewDate(null);
      return;
    }

    const ovulationDate = new Date(start);
    ovulationDate.setDate(start.getDate() + ovulationCycleDay - 1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    ovulationDate.setHours(0, 0, 0, 0);
    while (ovulationDate.getTime() < today.getTime()) {
      ovulationDate.setDate(ovulationDate.getDate() + safeCycleLength);
    }

    const y = ovulationDate.getFullYear();
    const mi = ovulationDate.getMonth();
    const day = ovulationDate.getDate();
    this.setSelectedCycleViewDate(`${y}-${mi}-${day}`);
  }

  /** Apply Trying-to-conceive home mode (does not overwrite period data). */
  applyTryingToConceiveHomeMode(): void {
    this.setUserStatus('Trying to Conceive');
    this.setPregnancyStatus(false);
    this.setPostpartumStatus(false);
    this.setMenopauseStatus(false);
    this.setGetPregnantProfileCardPending(true);
  }

  applyMenopauseHomeMode(stage: 'perimenopause' | 'menopause' = 'perimenopause'): void {
    this.setUserStatus('Menopause');
    this.setPregnancyStatus(false);
    this.setPostpartumStatus(false);
    this.setMenopauseStatus(true);
    this.setMenopauseStage(stage);
    this.clearGetPregnantProfileCardPending();
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
      if (typeof data.isMenopause === 'boolean') this.isMenopause.set(data.isMenopause);
      if (data.menopauseStage === 'perimenopause' || data.menopauseStage === 'menopause') {
        this.menopauseStage.set(data.menopauseStage);
      }
      if (typeof data.pregnancyWeek === 'number') this.pregnancyWeek.set(data.pregnancyWeek);
      if (typeof data.pregnancyProgress === 'number') this.pregnancyProgress.set(data.pregnancyProgress);
      if (typeof data.babyName === 'string') this.babyName.set(data.babyName);
      if (
        typeof data.selectedCycleViewDateStored === 'string' ||
        data.selectedCycleViewDateStored === null
      ) {
        this.selectedCycleViewDate.set(data.selectedCycleViewDateStored ?? null);
      }
      if (typeof data.getPregnantProfileCardPending === 'boolean') {
        this.getPregnantProfileCardPending.set(data.getPregnantProfileCardPending);
      }
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
        isMenopause: this.isMenopause(),
        menopauseStage: this.menopauseStage(),
        pregnancyWeek: this.pregnancyWeek(),
        pregnancyProgress: this.pregnancyProgress(),
        babyName: this.babyName(),
        selectedCycleViewDateStored: this.selectedCycleViewDate(),
        getPregnantProfileCardPending: this.getPregnantProfileCardPending(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch {}
  }
}
