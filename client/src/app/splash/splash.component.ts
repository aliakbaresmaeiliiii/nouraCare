import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { getInitialAppPath } from '../guards/initial-route.guard';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.component.html',
  styleUrl: './splash.component.scss',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: {
    class: 'ion-page',
    '[class.splash--exit]': 'isExiting',
  },
})
export class SplashComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  isExiting = false;

  private readonly displayMs = 2800;
  private readonly exitMs = 520;
  private navigateTimer: ReturnType<typeof setTimeout> | null = null;
  private exitTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.navigateTimer = setTimeout(() => this.finishSplash(), this.displayMs);
    this.destroyRef.onDestroy(() => this.clearTimers());
  }

  onSkip(): void {
    this.finishSplash();
  }

  private finishSplash(): void {
    if (this.isExiting) {
      return;
    }

    this.clearTimers();
    this.isExiting = true;
    this.exitTimer = setTimeout(() => {
      void this.router.navigateByUrl(getInitialAppPath(), { replaceUrl: true });
    }, this.exitMs);
  }

  private clearTimers(): void {
    if (this.navigateTimer) {
      clearTimeout(this.navigateTimer);
      this.navigateTimer = null;
    }
    if (this.exitTimer) {
      clearTimeout(this.exitTimer);
      this.exitTimer = null;
    }
  }
}
