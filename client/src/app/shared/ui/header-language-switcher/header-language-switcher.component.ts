import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonPopover } from '@ionic/angular/standalone';
import { Language, LanguageService, LANGUAGE_SWITCHING_ENABLED } from '@app/shared/services/language.service';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';

@Component({
  selector: 'app-header-language-switcher',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS, IonPopover],
  template: `
    <button
      type="button"
      class="lang-trigger"
      id="header-lang-trigger"
      [attr.aria-label]="'common.language' | translate"
      [attr.aria-expanded]="popoverOpen"
      aria-haspopup="listbox"
    >
      <span class="current-flag" aria-hidden="true">{{ getCurrentLanguageFlag() }}</span>
    </button>

    <ion-popover
      #langPopover
      trigger="header-lang-trigger"
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
      display: ${LANGUAGE_SWITCHING_ENABLED ? 'inline-flex' : 'none'};
      align-items: center;
    }

    .lang-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      margin: 0;
      padding: 0;
      border-radius: 12px;
      border: 1px solid rgba(var(--brand-text-rgb), 0.08);
      background: rgba(var(--brand-surface-rgb), 0.52);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.7),
        0 1px 2px rgba(var(--brand-text-rgb), 0.06);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      cursor: pointer;
      transition:
        background 0.2s ease,
        border-color 0.2s ease,
        transform 0.2s ease;
    }

    .lang-trigger:hover {
      background: rgba(var(--brand-surface-rgb), 0.72);
      border-color: rgba(var(--brand-text-rgb), 0.12);
    }

    .lang-trigger:active {
      transform: scale(0.96);
    }

    .lang-trigger:focus-visible {
      outline: 2px solid rgba(var(--brand-text-rgb), 0.95);
      outline-offset: 2px;
    }

    .current-flag {
      font-size: 22px;
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
  `],
})
export class HeaderLanguageSwitcherComponent implements OnInit {
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
