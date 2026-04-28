import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { GetPregnantIntroStateService } from '../shared/services/get-pregnant-intro-state.service';

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
  private introState = inject(GetPregnantIntroStateService);
  /** Step 4 of 4 — then calculating progress → home */
  readonly progressValue = 4 / 4;

  readonly options = ['diet_yes', 'diet_not_really', 'diet_need_learn'];

  onSkip(): void {
    this.introState.setAnswer('step10_healthy_diet', 'skipped');
    void this.router.navigate(['/track-pregnancy-intro-step12']);
  }

  onSelect(optionId: string): void {
    this.introState.setAnswer('step10_healthy_diet', optionId);
    void this.router.navigate(['/track-pregnancy-intro-step12']);
  }
}
