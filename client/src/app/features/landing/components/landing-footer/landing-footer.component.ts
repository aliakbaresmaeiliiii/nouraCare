import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs/operators';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import { LanguageService } from '@app/shared/services/language.service';
import { TranslationService } from '@app/shared/services/translation.service';

@Component({
  selector: 'app-landing-footer',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './landing-footer.component.html',
  styleUrl: './landing-footer.component.scss',
})
export class LandingFooterComponent {
  private readonly languageService = inject(LanguageService);
  private readonly translationService = inject(TranslationService);

  readonly year = new Date().getFullYear();

  readonly copy = toSignal(
    this.languageService.currentLanguage$.pipe(
      map(() =>
        this.translationService.translateParams('landing.footer.copy', {
          year: this.year,
        }),
      ),
    ),
    {
      initialValue: this.translationService.translateParams('landing.footer.copy', {
        year: this.year,
      }),
    },
  );
}
