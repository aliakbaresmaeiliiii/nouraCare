import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-track-pregnancy-intro-step9',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step9.component.html',
  styleUrls: ['./track-pregnancy-intro-step9.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep9Component {
  private router = inject(Router);
  readonly progressValue = 9 / 13;

  readonly options = [
    'Yes, they have',
    "I didn't know they needed to",
    "They don't take part in conception",
    "I don't have a partner at the moment",
    'No',
  ];

  onSkip(): void {
    void this.router.navigate(['/track-pregnancy-intro-step10']);
  }

  onSelect(): void {
    void this.router.navigate(['/track-pregnancy-intro-step10']);
  }
}
