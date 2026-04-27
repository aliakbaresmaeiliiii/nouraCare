import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnDestroy, OnInit } from '@angular/core';
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
  progress = 0;
  private progressTimer: ReturnType<typeof setInterval> | null = null;
  private navigateTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.startProgressAnimation();
  }

  ngOnDestroy(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
    }
    if (this.navigateTimer) {
      clearTimeout(this.navigateTimer);
    }
  }

  private startProgressAnimation(): void {
    this.progressTimer = setInterval(() => {
      if (this.progress >= 100) {
        if (this.progressTimer) {
          clearInterval(this.progressTimer);
        }
        this.navigateTimer = setTimeout(() => {
          void this.router.navigate(['/track-pregnancy-intro-step7']);
        }, 120);
        return;
      }
      this.progress += 1;
    }, 25);
  }

}
