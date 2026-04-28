import { Component, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { GetPregnantIntroStateService } from '../shared/services/get-pregnant-intro-state.service';

@Component({
  selector: 'app-track-pregnancy-intro-step4',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './track-pregnancy-intro-step4.component.html',
  styleUrls: ['./track-pregnancy-intro-step4.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class TrackPregnancyIntroStep4Component {
  private router = inject(Router);
  private introState = inject(GetPregnantIntroStateService);
  /** Step 2 of 4 */
  readonly progressValue = 2 / 4;

  readonly options = ['yes', 'no', 'waiting_appointment'];

  onSkip(): void {
    this.introState.setAnswer('step4_doctor_visit', 'skipped');
    void this.router.navigate(['/track-pregnancy-intro-step8']);
  }

  onSelect(optionId: string): void {
    this.introState.setAnswer('step4_doctor_visit', optionId);
    void this.router.navigate(['/track-pregnancy-intro-step8']);
  }
}
