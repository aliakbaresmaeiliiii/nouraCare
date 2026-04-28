import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { GetPregnantIntroStateService } from '../shared/services/get-pregnant-intro-state.service';

/** Q1 of 4 — leads into compact TTC intro (see step4 → step8 → step10 → step12). */
@Component({
  selector: 'app-track-pregnancy-intro-step2',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step2.component.html',
  styleUrls: ['./track-pregnancy-intro-step2.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep2Component {
  private router = inject(Router);
  private introState = inject(GetPregnantIntroStateService);
  /** Step 1 of 4 questions (linear bar before final calculating screen). */
  readonly progressValue = 1 / 4;
  readonly options = [
    'feeling_excited',
    'feeling_unsure',
    'feeling_stressed',
    'feeling_mixed',
  ];

  onSkip(): void {
    this.introState.setAnswer('step2_feeling', 'skipped');
    void this.router.navigate(['/track-pregnancy-intro-step4']);
  }

  onSelect(optionId: string): void {
    this.introState.setAnswer('step2_feeling', optionId);
    void this.router.navigate(['/track-pregnancy-intro-step4']);
  }
}
