import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { SHARED_STANDALONE_IMPORTS } from '../../shared-standalone';

export interface FertilityResults {
  fertileDays: string[];
  ovulationDay: string;
  nextPeriod: string;
  cycleLength: number;
  lastPeriodDate: string;
}

@Component({
  selector: 'app-fertility-results-modal',
  templateUrl: './fertility-results-modal.component.html',
  styleUrls: ['./fertility-results-modal.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS]
})
export class FertilityResultsModalComponent {
  @Input() results!: FertilityResults;

  constructor(private modalController: ModalController) {}

  dismiss() {
    this.modalController.dismiss();
  }

  trackSymptoms() {
    this.modalController.dismiss({ action: 'trackSymptoms' });
  }

  setReminder() {
    this.modalController.dismiss({ action: 'setReminder' });
  }

  exportResults() {
    this.modalController.dismiss({ action: 'exportResults' });
  }
}
