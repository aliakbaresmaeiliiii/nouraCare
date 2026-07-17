import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { star, starOutline } from 'ionicons/icons';
import { ModalController } from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '../../shared-standalone';
import { TranslationService } from '../../services/translation.service';

export interface FeedbackSheetResult {
  rating: number;
  message: string;
}

@Component({
  selector: 'app-feedback-sheet',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, FormsModule],
  templateUrl: './feedback-sheet.component.html',
  styleUrls: ['./feedback-sheet.component.scss'],
})
export class FeedbackSheetComponent {
  private readonly modalCtrl = inject(ModalController);
  private readonly translation = inject(TranslationService);

  readonly stars = [1, 2, 3, 4, 5] as const;
  readonly rating = signal(0);
  readonly message = signal('');
  readonly submitting = signal(false);

  constructor() {
    addIcons({ star, starOutline });
  }

  setRating(value: number): void {
    if (this.submitting()) {
      return;
    }
    this.rating.set(value);
  }

  ratingLabel(): string {
    const value = this.rating();
    if (value < 1) {
      return this.t('settings.feedback.rateHint');
    }
    return this.t(`settings.feedback.rating.${value}`);
  }

  canSubmit(): boolean {
    return this.rating() >= 1 && !this.submitting();
  }

  async cancel(): Promise<void> {
    await this.modalCtrl.dismiss(undefined, 'cancel');
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) {
      return;
    }

    this.submitting.set(true);
    const result: FeedbackSheetResult = {
      rating: this.rating(),
      message: this.message().trim(),
    };
    await this.modalCtrl.dismiss(result, 'confirm');
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
