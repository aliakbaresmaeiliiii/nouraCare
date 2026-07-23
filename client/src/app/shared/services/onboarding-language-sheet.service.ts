import { Injectable, inject } from '@angular/core';
import { ModalController } from '@ionic/angular/standalone';
import { LanguagePickSheetComponent } from '@app/shared/ui/language-pick-sheet/language-pick-sheet.component';
import {
  hasConfirmedOnboardingLanguage,
  type OnboardingLanguageChoice,
} from '@app/shared/utils/onboarding-language.util';

@Injectable({ providedIn: 'root' })
export class OnboardingLanguageSheetService {
  private readonly modalCtrl = inject(ModalController);
  private presenting = false;

  /**
   * Shows the language bottom sheet once before onboarding content.
   * Returns the chosen code, or null if already confirmed.
   */
  async presentIfNeeded(): Promise<OnboardingLanguageChoice | null> {
    if (hasConfirmedOnboardingLanguage() || this.presenting) {
      return null;
    }

    this.presenting = true;
    try {
      const modal = await this.modalCtrl.create({
        component: LanguagePickSheetComponent,
        breakpoints: [0, 0.58, 0.78],
        initialBreakpoint: 0.58,
        backdropDismiss: false,
        // Allow programmatic dismiss when the user picks a language (role: confirm).
        canDismiss: async (_data, role) => role === 'confirm',
        cssClass: 'language-pick-sheet',
      });

      await modal.present();

      const { data, role } =
        await modal.onDidDismiss<OnboardingLanguageChoice>();

      if (role === 'confirm' && (data === 'fa' || data === 'en')) {
        return data;
      }

      return null;
    } finally {
      this.presenting = false;
    }
  }
}
