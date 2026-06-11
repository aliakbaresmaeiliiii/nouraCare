import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonPopover } from '@ionic/angular/standalone';
import { Language, LanguageService } from '../../services/language.service';
import { SHARED_STANDALONE_IMPORTS } from '../../shared-standalone';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, IonPopover],
  template: `
    <button
      type="button"
      class="lang-trigger"
      id="login-lang-trigger"
      [attr.aria-label]="'common.language' | translate"
      [attr.aria-expanded]="popoverOpen"
      aria-haspopup="listbox"
    >
      <span class="current-flag" aria-hidden="true">{{ getCurrentLanguageFlag() }}</span>
    </button>

    <ion-popover
      #langPopover
      trigger="login-lang-trigger"
      triggerAction="click"
      side="bottom"
      alignment="end"
      class="lang-flag-popover"
      (didPresent)="popoverOpen = true"
      (didDismiss)="popoverOpen = false"
    >
      <ng-template>
        <div
          class="lang-flag-menu"
          role="listbox"
          [attr.aria-label]="'common.language' | translate"
        >
          @for (language of languages; track language.code) {
            <button
              type="button"
              class="lang-flag-option"
              role="option"
              [class.lang-flag-option--selected]="language.code === currentLanguage"
              [attr.aria-selected]="language.code === currentLanguage"
              [attr.aria-label]="'settings.langName.' + language.code | translate"
              (click)="selectLanguage(language.code)"
            >
              <span class="lang-flag-option__emoji" aria-hidden="true">{{ language.flag }}</span>
              @if (language.code === currentLanguage) {
                <span class="lang-flag-option__check" aria-hidden="true">✓</span>
              }
            </button>
          }
        </div>
      </ng-template>
    </ion-popover>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
    }

    .lang-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      margin: 0;
      padding: 0;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition:
        transform 0.2s ease,
        box-shadow 0.2s ease,
        border-color 0.2s ease;
    }

    .lang-trigger:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
      border-color: var(--ion-color-primary);
    }

    .lang-trigger:active {
      transform: scale(0.95);
    }

    .lang-trigger:focus-visible {
      outline: 2px solid var(--ion-color-primary);
      outline-offset: 2px;
    }

    .current-flag {
      font-size: 24px;
      line-height: 1;
      user-select: none;
    }

    .lang-flag-menu {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
    }

    .lang-flag-option {
      position: relative;
      flex: 0 0 auto;
      width: 48px;
      height: 48px;
      margin: 0;
      padding: 0;
      border-radius: 14px;
      border: 2px solid transparent;
      background: rgba(var(--brand-text-rgb), 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition:
        transform 0.15s ease,
        border-color 0.15s ease,
        background 0.15s ease,
        box-shadow 0.15s ease;
    }

    .lang-flag-option:hover {
      background: rgba(var(--brand-text-rgb), 0.1);
      transform: translateY(-1px);
    }

    .lang-flag-option:active {
      transform: scale(0.95);
    }

    .lang-flag-option:focus-visible {
      outline: 2px solid var(--ion-color-primary);
      outline-offset: 2px;
    }

    .lang-flag-option--selected {
      border-color: var(--ion-color-primary);
      background: rgba(var(--ion-color-primary-rgb), 0.12);
      box-shadow: 0 2px 8px rgba(var(--ion-color-primary-rgb), 0.2);
    }

    .lang-flag-option__emoji {
      font-size: 26px;
      line-height: 1;
      user-select: none;
    }

    .lang-flag-option__check {
      position: absolute;
      right: -2px;
      bottom: -2px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: var(--ion-color-primary);
      color: var(--ion-color-primary-contrast);
      font-size: 10px;
      font-weight: 700;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--ion-background-color, #fff);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
    }

    ion-popover.lang-flag-popover {
      --width: auto;
      --min-width: 0;
      --offset-y: 8px;
      --box-shadow: 0 10px 28px rgba(0, 0, 0, 0.14);
      --border-radius: 16px;
    }

    :host-context(html.ion-palette-dark) .lang-trigger {
      background: rgba(30, 30, 30, 0.9);
      border-color: rgba(255, 255, 255, 0.1);
    }

    @media (max-width: 768px) {
      .lang-trigger {
        width: 44px;
        height: 44px;
      }

      .current-flag {
        font-size: 22px;
      }
    }
  `],
})
export class LanguageSwitcherComponent implements OnInit {
  @ViewChild('langPopover') langPopover?: IonPopover;

  private readonly languageService = inject(LanguageService);
  private readonly destroyRef = inject(DestroyRef);

  languages: Language[] = [];
  currentLanguage = 'fa';
  popoverOpen = false;

  ngOnInit(): void {
    this.languages = this.languageService.getLanguages();
    this.languageService.currentLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((lang) => {
        this.currentLanguage = lang;
      });
  }

  selectLanguage(languageCode: string): void {
    this.languageService.setLanguage(languageCode);
    void this.langPopover?.dismiss();
  }

  getCurrentLanguageFlag(): string {
    return this.languageService.getLanguageFlag(this.currentLanguage);
  }
}
