import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { LanguageService } from '@app/shared/services/language.service';
import { LandingNavbarComponent } from './components/landing-navbar/landing-navbar.component';
import { LandingHeroComponent } from './components/landing-hero/landing-hero.component';
import { LandingFeaturesComponent } from './components/landing-features/landing-features.component';
import { LandingHowComponent } from './components/landing-how/landing-how.component';
import { LandingScreenshotsComponent } from './components/landing-screenshots/landing-screenshots.component';
import { LandingFaqComponent } from './components/landing-faq/landing-faq.component';
import { LandingCtaComponent } from './components/landing-cta/landing-cta.component';
import { LandingFooterComponent } from './components/landing-footer/landing-footer.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [
    LandingNavbarComponent,
    LandingHeroComponent,
    LandingFeaturesComponent,
    LandingHowComponent,
    LandingScreenshotsComponent,
    LandingFaqComponent,
    LandingCtaComponent,
    LandingFooterComponent,
  ],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
  host: {
    class: 'dh-landing-host',
  },
})
export class LandingPage {
  private readonly languageService = inject(LanguageService);

  readonly dir = toSignal(
    this.languageService.currentLanguage$.pipe(
      map(() => (this.languageService.isRtl() ? 'rtl' : 'ltr')),
    ),
    { initialValue: this.languageService.isRtl() ? 'rtl' : 'ltr' },
  );

  constructor() {
    const code = this.languageService.getCurrentLanguage() || 'fa';
    this.languageService.setMarketingLanguage(code);
  }
}
