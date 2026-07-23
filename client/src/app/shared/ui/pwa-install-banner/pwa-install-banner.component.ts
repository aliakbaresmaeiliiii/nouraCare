import { Component, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import { closeOutline, shareOutline } from 'ionicons/icons';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { PwaPlatformService } from '@app/shared/services/pwa-platform.service';
import { TranslationService } from '@app/shared/services/translation.service';

@Component({
  selector: 'app-pwa-install-banner',
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  template: `
    @if (visible) {
      <div class="pwa-install-banner" role="status">
        <ion-icon name="share-outline" aria-hidden="true"></ion-icon>
        <p>{{ message }}</p>
        <ion-button fill="clear" size="small" (click)="dismiss()" [attr.aria-label]="dismissLabel">
          <ion-icon slot="icon-only" name="close-outline"></ion-icon>
        </ion-button>
      </div>
    }
  `,
  styles: [
    `
      .pwa-install-banner {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.65rem 0.75rem;
        background: var(--brand-primary, #6366f1);
        color: #fff;
        font-size: 0.8125rem;
        line-height: 1.35;
        z-index: 9999;
      }
      .pwa-install-banner p {
        flex: 1;
        margin: 0;
      }
      .pwa-install-banner ion-icon:first-child {
        font-size: 1.25rem;
        flex-shrink: 0;
      }
      .pwa-install-banner ion-button {
        --color: #fff;
        margin: 0;
      }
    `,
  ],
})
export class PwaInstallBannerComponent {
  private readonly pwaPlatform = inject(PwaPlatformService);
  private readonly translation = inject(TranslationService);

  visible = this.pwaPlatform.shouldShowIosInstallHint();
  message = this.translation.translate('pwa.installHint');
  dismissLabel = this.translation.translate('pwa.dismiss');

  constructor() {
    addIcons({ closeOutline, shareOutline });
  }

  dismiss(): void {
    this.pwaPlatform.dismissIosInstallHint();
    this.visible = false;
  }
}
