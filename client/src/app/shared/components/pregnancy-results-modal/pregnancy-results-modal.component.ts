import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { IonIcon, IonButton } from '@ionic/angular/standalone';

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
  imports: [IonIcon],
})
export class PregnancyResultsModalComponent {
  @Input() results!: PregnancyResults;

  constructor(private modalController: ModalController) {}

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
