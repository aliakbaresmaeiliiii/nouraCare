import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { globeOutline, chevronDownOutline } from 'ionicons/icons';
import { Language, LanguageService } from '../../services/language.service';
import { SHARED_STANDALONE_IMPORTS } from '../../shared-standalone';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  template: `
    <div class="language-selector-container">
      <ion-select 
        [value]="currentLanguage" 
        (ionChange)="onLanguageChange($event)"
        interface="popover"
        class="language-select">
        <ion-select-option 
          *ngFor="let language of languages" 
          [value]="language.code"
          class="language-option">
          <div class="option-content">
            <span class="flag">{{ language.flag }}</span>
            <span class="name">{{ language.name }}</span>
          </div>
        </ion-select-option>
      </ion-select>
      
      <div class="flag-button" (click)="openLanguageMenu()">
        <span class="current-flag">{{ getCurrentLanguageFlag() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .language-selector-container {
      position: relative;
      display: inline-block;
    }

    .language-select {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      z-index: 2;
      cursor: pointer;
    }

    .flag-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      border-radius: 50%;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      border: 2px solid rgba(255, 255, 255, 0.3);
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .flag-button:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      border-color: var(--ion-color-primary);
    }

    .flag-button:active {
      transform: scale(0.95);
    }

    .current-flag {
      font-size: 24px;
      line-height: 1;
      user-select: none;
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
      width: 100%;
    }

    .flag {
      font-size: 24px;
      min-width: 30px;
      text-align: center;
    }

    .name {
      font-size: 16px;
      font-weight: 500;
      color: var(--ion-color-dark);
      flex: 1;
    }

    /* Dark mode support */
    :host-context(html.ion-palette-dark) {
      .flag-button {
        background: rgba(30, 30, 30, 0.9);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .name {
        color: var(--ion-color-light);
      }
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .flag-button {
        width: 44px;
        height: 44px;
      }

      .current-flag {
        font-size: 22px;
      }
    }

    /* Animation for flag change */
    .current-flag {
      transition: all 0.3s ease;
    }

    .flag-button:hover .current-flag {
      transform: scale(1.1);
    }
  `]
})
export class LanguageSwitcherComponent implements OnInit {
  languages: Language[] = [];
  currentLanguage: string = 'en';

  constructor(private languageService: LanguageService) {
    addIcons({ globeOutline, chevronDownOutline });
  }

  ngOnInit() {
    this.languages = this.languageService.getLanguages();
    this.languageService.currentLanguage$.subscribe(lang => {
      this.currentLanguage = lang;
    });
  }

  onLanguageChange(event: any) {
    const selectedLanguage = event.detail.value;
    this.languageService.setLanguage(selectedLanguage);
  }

  openLanguageMenu() {
    // The ion-select will automatically open when clicked
    // This method is here for potential future enhancements
  }

  getCurrentLanguageName(): string {
    return this.languageService.getLanguageName(this.currentLanguage);
  }

  getCurrentLanguageFlag(): string {
    return this.languageService.getLanguageFlag(this.currentLanguage);
  }
}
