import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-landing-cta',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './landing-cta.component.html',
  styleUrl: './landing-cta.component.scss',
})
export class LandingCtaComponent {}
