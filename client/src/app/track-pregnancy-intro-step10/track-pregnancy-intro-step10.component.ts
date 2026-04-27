import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-track-pregnancy-intro-step10',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step10.component.html',
  styleUrls: ['./track-pregnancy-intro-step10.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep10Component {
  private router = inject(Router);

  readonly options = [
    "Yes - I've already made positive changes in my diet to get ready for conception",
    'Not really - I could be eating better',
    "I'm not sure - I'd like to learn what I could change about my diet",
  ];

  onSkip(): void {
    void this.router.navigate(['/track-pregnancy-intro-step11']);
  }

  onSelect(): void {
    void this.router.navigate(['/track-pregnancy-intro-step11']);
  }
}
