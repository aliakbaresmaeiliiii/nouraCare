import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-track-pregnancy-intro-step11',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step11.component.html',
  styleUrls: ['./track-pregnancy-intro-step11.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep11Component {
  private router = inject(Router);
  selectedOption: string | null = null;
  private navigateTimer: ReturnType<typeof setTimeout> | null = null;

  readonly options = [
    'Is there a best sex position for getting pregnant?',
    'Do orgasms boost your odds of conception?',
    'Is it OK to pee or shower after sex?',
    'Do some lubes have a negative effect on sperm?',
    "I'm not having sex for conception",
    "No, I don't have any questions",
  ];

  onSkip(): void {
    void this.router.navigate(['/track-pregnancy-intro-step12']);
  }

  onSelect(option: string): void {
    this.selectedOption = option;
    if (this.navigateTimer) {
      clearTimeout(this.navigateTimer);
    }
    this.navigateTimer = setTimeout(() => {
      void this.router.navigate(['/track-pregnancy-intro-step12']);
    }, 160);
  }
}
