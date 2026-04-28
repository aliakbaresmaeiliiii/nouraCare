import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-track-pregnancy-intro-step8',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step8.component.html',
  styleUrls: ['./track-pregnancy-intro-step8.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep8Component {
  private router = inject(Router);
  /** Step 3 of 4 */
  readonly progressValue = 3 / 4;

  readonly options = [
    'Yes',
    'Not yet',
    "I'm waiting for an appointment",
    "I didn't think it was necessary",
  ];

  onSkip(): void {
    void this.router.navigate(['/track-pregnancy-intro-step10']);
  }

  onSelect(): void {
    void this.router.navigate(['/track-pregnancy-intro-step10']);
  }
}
