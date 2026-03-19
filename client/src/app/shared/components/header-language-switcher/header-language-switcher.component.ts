import { Component, OnInit } from '@angular/core';
import { addIcons } from 'ionicons';
import { globeOutline } from 'ionicons/icons';
import { Language, LanguageService } from '../../services/language.service';
import { SHARED_STANDALONE_IMPORTS } from '../../shared-standalone';

@Component({
  selector: 'app-header-language-switcher',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  template: `
    <div class="header-language-container"> 
      <ion-select 
        [value]="currentLanguage" 
        (ionChange)="onLanguageChange($event)"
        interface="popover"
        class="header-language-select">
        <ion-select-option 
          *ngFor="let language of languages" 
          [value]="language.code">
          <div class="option-content">
            <span class="flag">{{ language.flag }}</span>
            <span class="name">{{ language.name }}</span>
          </div>
        </ion-select-option>
      </ion-select>
      
      <div class="header-flag-button">
        <span class="current-flag">{{ getCurrentLanguageFlag() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .header-language-container {
      position: relative;
      display: inline-block;
    }
    
    .header-language-select {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      z-index: 2;
      cursor: pointer;
    }

    .header-flag-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .header-flag-button:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: scale(1.1);
    }

    .current-flag {
      font-size: 18px;
      line-height: 1;
      user-select: none;
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 0;
      width: 100%;
    }

    .flag {
      font-size: 20px;
      min-width: 25px;
      text-align: center;
    }

    .name {
      font-size: 14px;
      font-weight: 500;
      color: var(--ion-color-dark);
      flex: 1;
    }
  `]
})
export class HeaderLanguageSwitcherComponent implements OnInit {
  languages: Language[] = [];
  currentLanguage: string = 'en';

  constructor(private languageService: LanguageService) {
    addIcons({ globeOutline });
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

  getCurrentLanguageFlag(): string {
    return this.languageService.getLanguageFlag(this.currentLanguage);
  }
}
