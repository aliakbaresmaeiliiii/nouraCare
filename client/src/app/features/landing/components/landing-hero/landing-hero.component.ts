import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-landing-hero',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './landing-hero.component.html',
  styleUrl: './landing-hero.component.scss',
})
export class LandingHeroComponent {
  readonly logoSrc = 'assets/branding/logo.png';
}
