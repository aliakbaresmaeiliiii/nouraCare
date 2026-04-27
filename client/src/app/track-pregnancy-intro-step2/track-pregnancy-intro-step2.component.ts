import { Component, CUSTOM_ELEMENTS_SCHEMA, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-track-pregnancy-intro-step2',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step2.component.html',
  styleUrls: ['./track-pregnancy-intro-step2.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep2Component implements OnInit, OnDestroy {
  private router = inject(Router);
  progress = 0;
  private progressTimer: ReturnType<typeof setInterval> | null = null;
  private readonly targetProgress = Math.round((2 / 13) * 100);
  readonly options = [
    "Excited for what's to come! 😀",
    'A bit unsure or unprepared 😕',
    'Worried or stressed 😪',
    'Happy, nervous, and excited - all at the same time! 🥹',
  ];

  ngOnInit(): void {
    this.startProgressAnimation();
  }

  ngOnDestroy(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }

  onSkip(): void {
    void this.router.navigate(['/edit-profile'], {
      queryParams: { pregnancyIntro: '1' },
    });
  }

  onSelect(): void {
    void this.router.navigate(['/track-pregnancy-intro-step3']);
  }

  private startProgressAnimation(): void {
    this.progressTimer = setInterval(() => {
      if (this.progress >= this.targetProgress) {
        if (this.progressTimer) {
          clearInterval(this.progressTimer);
          this.progressTimer = null;
        }
        return;
      }
      this.progress += 1;
    }, 18);
  }
}
