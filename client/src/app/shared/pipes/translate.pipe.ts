import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
  import { TranslationService } from '../services/translation.service';
import { LanguageService } from '../services/language.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Make it impure so it updates when language changes
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private languageSubscription: Subscription;

  constructor(
    private translationService: TranslationService,
    private languageService: LanguageService
  ) {
    // Subscribe to language changes to trigger pipe updates
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(() => {
      // This subscription ensures the pipe updates when language changes
    });
  }

  transform(key: string): string {
    return this.translationService.translate(key);
  }

  ngOnDestroy() {
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }
}
