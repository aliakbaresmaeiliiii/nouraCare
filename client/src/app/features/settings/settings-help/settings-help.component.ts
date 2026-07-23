import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { logoInstagram, mailOutline, paperPlaneOutline } from 'ionicons/icons';
import { ActionSheetController } from '@ionic/angular/standalone';
import { TranslationService } from '@app/shared/services/translation.service';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';

@Component({
  selector: 'app-settings-help',
  templateUrl: './settings-help.component.html',
  styleUrls: ['./settings-help.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class SettingsHelpComponent {
  private readonly router = inject(Router);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly translation = inject(TranslationService);

  constructor() {
    addIcons({ logoInstagram, mailOutline, paperPlaneOutline });
  }

  goBack(): void {
    void this.router.navigate(['/settings']);
  }

  async openContactOptions(): Promise<void> {
    const subject = encodeURIComponent('DoreHealth — Support');
    const body = encodeURIComponent('Hi DoreHealth team,\n\n');
    const mailto = `mailto:support@dorehealth.app?subject=${subject}&body=${body}`;

    const sheet = await this.actionSheetCtrl.create({
      header: this.t('menu.contactUs'),
      subHeader: this.t('menu.contactUsHint'),
      buttons: [
        {
          text: this.t('menu.contactUsEmail'),
          icon: 'mail-outline',
          handler: () => {
            window.open(mailto, '_blank', 'noopener,noreferrer');
          },
        },
        {
          text: this.t('menu.contactUsTelegram'),
          icon: 'paper-plane-outline',
          handler: () => {
            window.open('https://t.me/dorehealth', '_blank', 'noopener,noreferrer');
          },
        },
        {
          text: this.t('menu.contactUsInstagram'),
          icon: 'logo-instagram',
          handler: () => {
            window.open('https://instagram.com/dorehealth', '_blank', 'noopener,noreferrer');
          },
        },
        {
          text: this.t('menu.contactUsAbout'),
          icon: 'information-circle-outline',
          handler: () => {
            void this.router.navigate(['/tabs/about']);
          },
        },
        { text: this.t('common.cancel'), role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  openFeedback(): void {
    const subject = encodeURIComponent('DoreHealth App Feedback');
    const body = encodeURIComponent(
      'Hi DoreHealth team,\n\nI would like to share the following feedback:\n\n',
    );
    window.open(`mailto:support@dorehealth.app?subject=${subject}&body=${body}`);
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
