import { Component, inject, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { SHARED_STANDALONE_IMPORTS } from '../../shared-standalone';
import { TranslationService } from '../../services/translation.service';

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

  private modalController = inject(ModalController);
  private translation = inject(TranslationService);

  cycleLengthLabel(): string {
    return this.translation.translateParams('fertilityResults.basedOnCycle', {
      days: this.results.cycleLength,
    });
  }

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
