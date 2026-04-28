import { Component, CUSTOM_ELEMENTS_SCHEMA, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

/** Legacy route — compact flow skips this screen (see intro → step2 → step4). */
@Component({
  selector: 'app-track-pregnancy-intro-step3',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step3.component.html',
  styleUrls: ['./track-pregnancy-intro-step3.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep3Component implements OnInit {
  private router = inject(Router);

  ngOnInit(): void {
    void this.router.navigate(['/track-pregnancy-intro-step4'], {
      replaceUrl: true,
    });
  }

  readonly progressValue = 3 / 13;
  readonly heroImageSrc =
    'assets/images/onboarding/track-pregnancy-intro-step3-result.png';

  continueNext(): void {
    void this.router.navigate(['/track-pregnancy-intro-step4']);
  }
}
