import { Component, Input, OnChanges, OnInit, inject } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IonIcon } from '@ionic/angular/standalone';
import { LocalizedNumberPipe } from '@app/shared/pipes/localized-number.pipe';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { TranslationService } from '@app/shared/services/translation.service';
import { LanguageService } from '@app/shared/services/language.service';

export interface PregnancyResults {
  pregnancyWeek: number;
  dueDate: string;
  remainingWeeks: number;
  progressPercentage: number;
  trimester: number;
  lastPeriodDate: string;
  daysSinceConception: number;
}

@Component({
  selector: 'app-pregnancy-results-modal',
  templateUrl: './pregnancy-results-modal.component.html',
  styleUrls: ['./pregnancy-results-modal.component.scss'],
  standalone: true,
  imports: [IonIcon, LocalizedNumberPipe, TranslatePipe],
})
export class PregnancyResultsModalComponent implements OnInit, OnChanges {
  @Input() results!: PregnancyResults;

  private modalController = inject(ModalController);
  private translation = inject(TranslationService);
  private languageService = inject(LanguageService);

  progressThroughLabel = '';
  sizeOfLabel = '';
  healthTipsTitleLabel = '';

  ngOnInit(): void {
    this.languageService.currentLanguage$.subscribe(() => this.refreshLabels());
    this.refreshLabels();
  }

  ngOnChanges(): void {
    this.refreshLabels();
  }

  private refreshLabels(): void {
    if (!this.results) {
      return;
    }
    this.progressThroughLabel = this.translation.translateParams(
      'pregnancyResults.progressThrough',
      { percent: this.results.progressPercentage },
    );
    this.sizeOfLabel = this.translation.translateParams('pregnancyResults.sizeOf', {
      fruit: this.getBabySize().fruit,
    });
    this.healthTipsTitleLabel = this.translation.translateParams(
      'pregnancyResults.healthTipsTitle',
      { week: this.results.pregnancyWeek },
    );
  }

  getMilestoneKeys(): string[] {
    const week = this.results.pregnancyWeek;
    const keys: string[] = [];
    if (week < 8) {
      keys.push('pregnancyResults.milestone.organsForming');
    }
    if (week >= 8) {
      keys.push('pregnancyResults.milestone.heartBeating');
    }
    if (week >= 12) {
      keys.push('pregnancyResults.milestone.miscarriageRisk');
    }
    if (week >= 16) {
      keys.push('pregnancyResults.milestone.movements');
    }
    if (week >= 20) {
      keys.push('pregnancyResults.milestone.anatomyScan');
    }
    if (week >= 24) {
      keys.push('pregnancyResults.milestone.hearing');
    }
    if (week >= 28) {
      keys.push('pregnancyResults.milestone.eyes');
    }
    if (week >= 32) {
      keys.push('pregnancyResults.milestone.weightGain');
    }
    if (week >= 37) {
      keys.push('pregnancyResults.milestone.fullTerm');
    }
    return keys;
  }

  getHealthTipKeys(): string[] {
    return [
      'pregnancyResults.tip.prenatalVitamins',
      'pregnancyResults.tip.hydration',
      'pregnancyResults.tip.rest',
      'pregnancyResults.tip.appointments',
      'pregnancyResults.tip.trackSymptoms',
    ];
  }

  dismiss() {
    this.modalController.dismiss();
  }

  updateProfile() {
    this.modalController.dismiss({ action: 'updateProfile' });
  }

  trackSymptoms() {
    this.modalController.dismiss({ action: 'trackSymptoms' });
  }

  setAppointment() {
    this.modalController.dismiss({ action: 'setAppointment' });
  }

  getTrimesterName(): string {
    switch (this.results.trimester) {
      case 1:
        return 'First Trimester';
      case 2:
        return 'Second Trimester';
      case 3:
        return 'Third Trimester';
      default:
        return 'Pregnancy';
    }
  }

  getBabySize(): { fruit: string; emoji: string; description: string } {
    const week = this.results.pregnancyWeek;

    if (week >= 4 && week <= 6)
      return {
        fruit: 'Poppy Seed',
        emoji: '🌱',
        description: 'Your baby is just beginning to develop!',
      };
    if (week >= 7 && week <= 8)
      return {
        fruit: 'Blueberry',
        emoji: '🫐',
        description: 'Tiny but growing rapidly!',
      };
    if (week >= 9 && week <= 10)
      return {
        fruit: 'Cherry',
        emoji: '🍒',
        description: 'All major organs are forming!',
      };
    if (week >= 11 && week <= 12)
      return {
        fruit: 'Lime',
        emoji: '🟢',
        description: 'Your baby can make a fist!',
      };
    if (week >= 13 && week <= 16)
      return {
        fruit: 'Lemon',
        emoji: '🍋',
        description: 'Your baby can hear your voice!',
      };
    if (week >= 17 && week <= 20)
      return {
        fruit: 'Banana',
        emoji: '🍌',
        description: 'You might feel first movements!',
      };
    if (week >= 21 && week <= 24)
      return {
        fruit: 'Papaya',
        emoji: '🥭',
        description: 'Your baby is getting stronger!',
      };
    if (week >= 25 && week <= 28)
      return {
        fruit: 'Eggplant',
        emoji: '🍆',
        description: 'Brain development is rapid!',
      };
    if (week >= 29 && week <= 32)
      return {
        fruit: 'Coconut',
        emoji: '🥥',
        description: 'Your baby is putting on weight!',
      };
    if (week >= 33 && week <= 36)
      return {
        fruit: 'Pineapple',
        emoji: '🍍',
        description: 'Almost ready to meet you!',
      };
    if (week >= 37)
      return {
        fruit: 'Watermelon',
        emoji: '🍉',
        description: 'Your baby is full-term!',
      };

    return {
      fruit: 'Growing',
      emoji: '👶',
      description: 'Your miracle is developing!',
    };
  }
}
