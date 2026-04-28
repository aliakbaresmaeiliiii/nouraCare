import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { GetPregnantIntroStateService } from '../shared/services/get-pregnant-intro-state.service';

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
  private introState = inject(GetPregnantIntroStateService);
  /** Step 3 of 4 */
  readonly progressValue = 3 / 4;

  readonly options = ['yes', 'not_yet', 'waiting_appointment', 'not_necessary'];

  onSkip(): void {
    this.introState.setAnswer('step8_prepreg_checkup', 'skipped');
    void this.router.navigate(['/track-pregnancy-intro-step10']);
  }

  onSelect(optionId: string): void {
    this.introState.setAnswer('step8_prepreg_checkup', optionId);
    void this.router.navigate(['/track-pregnancy-intro-step10']);
  }
}
