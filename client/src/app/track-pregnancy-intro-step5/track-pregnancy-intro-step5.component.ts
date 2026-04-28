import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

/** Legacy route — skipped in compact TTC intro. */
@Component({
  selector: 'app-track-pregnancy-intro-step5',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step5.component.html',
  styleUrls: ['./track-pregnancy-intro-step5.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep5Component implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    void this.router.navigate(['/track-pregnancy-intro-step8'], {
      replaceUrl: true,
    });
  }

  readonly progressValue = 5 / 13;
  readonly heroImageSrc =
    'assets/images/onboarding/track-pregnancy-intro-step2-hearts.png';

  continueNext(): void {
    void this.router.navigate(['/track-pregnancy-intro-step8']);
  }
}
