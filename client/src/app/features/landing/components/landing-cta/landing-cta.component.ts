import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing-cta',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './landing-cta.component.html',
  styleUrl: './landing-cta.component.scss',
})
export class LandingCtaComponent {}
