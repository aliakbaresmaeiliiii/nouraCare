import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-track-pregnancy-intro-step6',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step6.component.html',
  styleUrls: ['./track-pregnancy-intro-step6.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep6Component implements OnInit, OnDestroy {
  private router = inject(Router);
  private progressTimer: ReturnType<typeof setInterval> | null = null;

  progress = 27;
  showFirstPregnancyDialog = false;
  private askedFirstPregnancy = false;
  private readonly maxProgress = 100;

  ngOnInit(): void {
    this.startProgress();
  }

  private startProgress(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
    this.progressTimer = setInterval(() => {
      if (this.showFirstPregnancyDialog) {
        return;
      }

      this.progress = Math.min(this.maxProgress, this.progress + 1);

      if (!this.askedFirstPregnancy && this.progress >= 30) {
        this.askedFirstPregnancy = true;
        this.showFirstPregnancyDialog = true;
        return;
      }

      if (this.progress >= this.maxProgress) {
        this.stopProgress();
        void this.router.navigate(['/track-pregnancy-intro-step7']);
      }
    }, 55);
  }

  onFirstPregnancyAnswer(_isFirstPregnancy: boolean): void {
    this.showFirstPregnancyDialog = false;
  }

  private stopProgress(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  get dashOffset(): number {
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    return circumference * (1 - this.progress / 100);
  }

  ngOnDestroy(): void {
    this.stopProgress();
  }
}
