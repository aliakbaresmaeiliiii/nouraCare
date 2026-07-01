import { Component, inject, signal } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '../../shared-standalone';
import type { OnboardingLanguageChoice } from '../../utils/onboarding-language.util';

@Component({
  selector: 'app-language-pick-sheet',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  templateUrl: './language-pick-sheet.component.html',
  styleUrls: ['./language-pick-sheet.component.scss'],
})
export class LanguagePickSheetComponent {
  private readonly modalCtrl = inject(ModalController);

  readonly selected = signal<OnboardingLanguageChoice | null>(null);
  readonly isConfirming = signal(false);

  selectLanguage(code: OnboardingLanguageChoice): void {
    if (this.isConfirming()) {
      return;
    }
    this.selected.set(code);
    void this.confirm(code);
  }

  private async confirm(code: OnboardingLanguageChoice): Promise<void> {
    this.isConfirming.set(true);
    await this.modalCtrl.dismiss(code, 'confirm');
  }
}
