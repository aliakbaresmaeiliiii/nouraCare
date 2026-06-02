import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  ActionSheetController,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { TranslationService } from '../shared/services/translation.service';
import { LanguageService } from '../shared/services/language.service';

interface AboutFeature {
  id: string;
  titleKey: string;
  descriptionKey: string;
  modalTitleKey: string;
  modalDescriptionKey: string;
  icon: string;
}

interface AboutTeamMember {
  id: string;
  nameKey: string;
  roleKey: string;
  bioKey: string;
  altKey: string;
  imageSrc: string;
}

interface AboutStat {
  valueKey: string;
  labelKey: string;
}

interface AboutSocialPlatform {
  id: string;
  nameKey: string;
  handle: string;
  icon: string;
  cssClass: string;
  url: string;
}

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class AboutComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly actionSheetController = inject(ActionSheetController);
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private langChangeSub?: Subscription;

  readonly appVersion = '2.1.0';

  readonly features: AboutFeature[] = [
    {
      id: 'tracking',
      titleKey: 'about.features.tracking.title',
      descriptionKey: 'about.features.tracking.description',
      modalTitleKey: 'about.features.tracking.modalTitle',
      modalDescriptionKey: 'about.features.tracking.modalDescription',
      icon: 'analytics',
    },
    {
      id: 'consultation',
      titleKey: 'about.features.consultation.title',
      descriptionKey: 'about.features.consultation.description',
      modalTitleKey: 'about.features.consultation.modalTitle',
      modalDescriptionKey: 'about.features.consultation.modalDescription',
      icon: 'medical',
    },
    {
      id: 'education',
      titleKey: 'about.features.education.title',
      descriptionKey: 'about.features.education.description',
      modalTitleKey: 'about.features.education.modalTitle',
      modalDescriptionKey: 'about.features.education.modalDescription',
      icon: 'school',
    },
    {
      id: 'community',
      titleKey: 'about.features.community.title',
      descriptionKey: 'about.features.community.description',
      modalTitleKey: 'about.features.community.modalTitle',
      modalDescriptionKey: 'about.features.community.modalDescription',
      icon: 'people',
    },
  ];

  readonly teamMembers: AboutTeamMember[] = [
    {
      id: 'dr-sarah',
      nameKey: 'about.team.drSarah.name',
      roleKey: 'about.team.drSarah.role',
      bioKey: 'about.team.drSarah.bio',
      altKey: 'about.team.drSarah.alt',
      imageSrc: 'assets/images/doctor.jpg',
    },
    {
      id: 'dr-michael',
      nameKey: 'about.team.drMichael.name',
      roleKey: 'about.team.drMichael.role',
      bioKey: 'about.team.drMichael.bio',
      altKey: 'about.team.drMichael.alt',
      imageSrc: 'assets/images/nurse.png',
    },
    {
      id: 'dr-emily',
      nameKey: 'about.team.drEmily.name',
      roleKey: 'about.team.drEmily.role',
      bioKey: 'about.team.drEmily.bio',
      altKey: 'about.team.drEmily.alt',
      imageSrc: 'assets/images/doctor.jpg',
    },
    {
      id: 'maria',
      nameKey: 'about.team.maria.name',
      roleKey: 'about.team.maria.role',
      bioKey: 'about.team.maria.bio',
      altKey: 'about.team.maria.alt',
      imageSrc: 'assets/images/nurse.png',
    },
  ];

  readonly stats: AboutStat[] = [
    {
      valueKey: 'about.stats.activeUsersValue',
      labelKey: 'about.stats.activeUsers',
    },
    {
      valueKey: 'about.stats.expertCoursesValue',
      labelKey: 'about.stats.expertCourses',
    },
    {
      valueKey: 'about.stats.healthcarePartnersValue',
      labelKey: 'about.stats.healthcarePartners',
    },
    {
      valueKey: 'about.stats.userRatingValue',
      labelKey: 'about.stats.userRating',
    },
  ];

  readonly socialPlatforms: AboutSocialPlatform[] = [
    {
      id: 'instagram',
      nameKey: 'about.social.instagram',
      handle: '@nouracare',
      icon: 'logo-instagram',
      cssClass: 'instagram',
      url: 'https://instagram.com/gahvare',
    },
    {
      id: 'facebook',
      nameKey: 'about.social.facebook',
      handle: '@nouracare',
      icon: 'logo-facebook',
      cssClass: 'facebook',
      url: 'https://facebook.com/gahvare',
    },
    {
      id: 'twitter',
      nameKey: 'about.social.twitter',
      handle: '@nouracare',
      icon: 'logo-twitter',
      cssClass: 'twitter',
      url: 'https://twitter.com/gahvare',
    },
    {
      id: 'youtube',
      nameKey: 'about.social.youtube',
      handle: '@nouracare',
      icon: 'logo-youtube',
      cssClass: 'youtube',
      url: 'https://youtube.com/gahvare',
    },
  ];

  ngOnInit(): void {
    this.langChangeSub = this.languageService.currentLanguage$.subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.langChangeSub?.unsubscribe();
  }

  get versionLabel(): string {
    return this.tParams('about.versionLabel', { version: this.appVersion });
  }

  get updatedLabel(): string {
    return this.t('about.updatedLabel');
  }

  async contactSupport(): Promise<void> {
    const alert = await this.alertController.create({
      header: this.t('about.contact.header'),
      message: this.t('about.contact.message'),
      buttons: [
        {
          text: this.t('menu.contactUsEmail'),
          handler: () => {
            void this.showToast(this.t('about.toast.openingEmail'));
          },
        },
        {
          text: this.t('about.contact.liveChat'),
          handler: () => {
            void this.showToast(this.t('about.toast.chatDisabled'));
          },
        },
        {
          text: this.t('about.contact.callUs'),
          handler: () => {
            void this.showToast(this.t('about.toast.dialerSoon'));
          },
        },
        { text: this.t('common.cancel'), role: 'cancel' },
      ],
    });
    await alert.present();
  }

  async followSocialMedia(platformId: string): Promise<void> {
    const platform = this.socialPlatforms.find((p) => p.id === platformId);
    if (!platform) {
      return;
    }

    const platformName = this.t(platform.nameKey);
    const alert = await this.alertController.create({
      header: this.tParams('about.social.followHeader', {
        platform: platformName,
      }),
      message: this.tParams('about.social.openMessage', {
        platform: platformName,
      }),
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('about.common.open'),
          handler: () => {
            window.open(platform.url, '_blank', 'noopener,noreferrer');
          },
        },
      ],
    });
    await alert.present();
  }

  async viewTeamMember(memberId: string): Promise<void> {
    const member = this.teamMembers.find((m) => m.id === memberId);
    if (!member) {
      return;
    }

    const alert = await this.alertController.create({
      header: this.t(member.nameKey),
      message: `${this.t(member.roleKey)}\n\n${this.t(member.bioKey)}`,
      buttons: [
        { text: this.t('about.common.close'), role: 'cancel' },
        {
          text: this.t('about.team.bookConsultation'),
          handler: () => {
            void this.router.navigate(['/tabs/consultation']);
            void this.showToast(this.t('about.toast.openingConsultations'));
          },
        },
      ],
    });
    await alert.present();
  }

  async learnMoreFeature(featureId: string): Promise<void> {
    const feature = this.features.find((f) => f.id === featureId);
    if (!feature) {
      return;
    }

    const alert = await this.alertController.create({
      header: this.t(feature.modalTitleKey),
      message: this.t(feature.modalDescriptionKey),
      buttons: [
        { text: this.t('about.common.close'), role: 'cancel' },
        {
          text: this.t('about.features.exploreApp'),
          handler: () => {
            void this.router.navigate(['/tabs/home']);
          },
        },
      ],
    });
    await alert.present();
  }

  viewPrivacyPolicy(): void {
    void this.router.navigate(['/privacy-policy']);
  }

  async openQuickMenu(): Promise<void> {
    const sheet = await this.actionSheetController.create({
      header: this.t('about.quickMenu.header'),
      buttons: [
        {
          text: this.t('about.quickMenu.contactSupport'),
          handler: () => {
            void this.contactSupport();
          },
        },
        {
          text: this.t('settings.feedback.title'),
          handler: () => {
            void this.showToast(this.t('about.toast.feedbackSoon'));
          },
        },
        {
          text: this.t('about.quickMenu.rateApp'),
          handler: () => {
            void this.showToast(this.t('about.toast.rateSoon'));
          },
        },
        {
          text: this.t('menu.inviteFriends'),
          handler: () => {
            void this.router.navigate(['/invite-friends']);
          },
        },
        { text: this.t('common.cancel'), role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }

  private tParams(
    key: string,
    params: Record<string, string | number>,
  ): string {
    return this.translation.translateParams(key, params);
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'bottom',
    });
    await toast.present();
  }
}
