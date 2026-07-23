import { Component } from '@angular/core';
import { LandingNavbarComponent } from './components/landing-navbar/landing-navbar.component';
import { LandingHeroComponent } from './components/landing-hero/landing-hero.component';
import { LandingFeaturesComponent } from './components/landing-features/landing-features.component';
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
export class LandingPage {}
