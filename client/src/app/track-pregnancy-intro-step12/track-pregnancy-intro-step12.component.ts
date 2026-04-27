import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-track-pregnancy-intro-step12',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step12.component.html',
  styleUrls: ['./track-pregnancy-intro-step12.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep12Component implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private timer: ReturnType<typeof setInterval> | null = null;
  progress = 26;

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.progress = Math.min(100, this.progress + 1);
      if (this.progress >= 100) {
        this.stopTimer();
        void this.router.navigate(['/track-pregnancy-intro-step13']);
      }
    }, 45);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  get dashOffset(): number {
    const radius = 120;
    const circumference = 2 * Math.PI * radius;
    return circumference * (1 - this.progress / 100);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
