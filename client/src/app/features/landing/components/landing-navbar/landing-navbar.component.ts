import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@app/shared/pipes/translate.pipe';
import {
  Language,
  LanguageService,
} from '@app/shared/services/language.service';

@Component({
  selector: 'app-landing-navbar',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  templateUrl: './landing-navbar.component.html',
  styleUrl: './landing-navbar.component.scss',
})
export class LandingNavbarComponent {
  private readonly languageService = inject(LanguageService);

  readonly menuOpen = signal(false);
  readonly langOpen = signal(false);
  readonly logoSrc = 'assets/branding/logo.png';

  readonly navLinks = [
    { href: '#features', labelKey: 'landing.nav.features' },
    { href: '#how', labelKey: 'landing.nav.how' },
    { href: '#screenshots', labelKey: 'landing.nav.product' },
    { href: '#faq', labelKey: 'landing.nav.faq' },
  ] as const;

  get languages(): Language[] {
    return this.languageService.getMarketingLanguages();
  }

  get currentLanguage(): string {
    return this.languageService.getCurrentLanguage();
  }

  get currentFlag(): string {
    return this.languageService.getLanguageFlag(this.currentLanguage);
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
    this.langOpen.set(false);
    document.body.style.overflow = this.menuOpen() ? 'hidden' : '';
  }

  closeMenu(): void {
    this.menuOpen.set(false);
    document.body.style.overflow = '';
  }

  toggleLang(): void {
    this.langOpen.update((v) => !v);
  }

  selectLanguage(code: string): void {
    this.languageService.setMarketingLanguage(code);
    this.langOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.nav__lang')) {
      this.langOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
    this.langOpen.set(false);
  }
}
