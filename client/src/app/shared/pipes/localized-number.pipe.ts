import { Pipe, PipeTransform, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LanguageService } from '@app/shared/services/language.service';
import { formatLocalizedNumber } from '@app/shared/utils/locale-date-format.util';

@Pipe({
  name: 'localNum',
  standalone: true,
  pure: false,
})
export class LocalizedNumberPipe implements PipeTransform, OnDestroy {
  private languageSubscription: Subscription;

  constructor(private languageService: LanguageService) {
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(
      () => {},
    );
  }

  transform(value: number | string | null | undefined): string {
    if (value === null || value === undefined) {
      return '';
    }
    return formatLocalizedNumber(value, this.languageService.getCurrentLanguage());
  }

  ngOnDestroy(): void {
    this.languageSubscription?.unsubscribe();
  }
}
