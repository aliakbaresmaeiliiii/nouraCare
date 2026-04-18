import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  ActionSheetController,
  AlertController,
  ToastController,
} from '@ionic/angular/standalone';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class AboutComponent {
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);
  private readonly actionSheetController = inject(ActionSheetController);

  async contactSupport(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Contact support',
      message:
        'Choose how you would like to reach us:\n\n• Email for account and technical questions\n• In-app chat when available\n• Phone for urgent issues',
      buttons: [
        {
          text: 'Email support',
          handler: () => {
            void this.showToast('Opening email…');
          },
        },
        {
          text: 'Live chat',
          handler: () => {
            void this.showToast('Chat will open here when enabled.');
          },
        },
        {
          text: 'Call us',
          handler: () => {
            void this.showToast('Dialer integration coming soon.');
          },
        },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await alert.present();
  }

  async followSocialMedia(platform: string): Promise<void> {
    const platforms = {
      instagram: { name: 'Instagram', url: 'https://instagram.com/gahvare' },
      facebook: { name: 'Facebook', url: 'https://facebook.com/gahvare' },
      twitter: { name: 'Twitter', url: 'https://twitter.com/gahvare' },
      youtube: { name: 'YouTube', url: 'https://youtube.com/gahvare' },
    } as const;

    const platformInfo = platforms[platform as keyof typeof platforms];
    if (!platformInfo) {
      return;
    }

    const alert = await this.alertController.create({
      header: `Follow on ${platformInfo.name}`,
      message: `Open our ${platformInfo.name} page in your browser?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Open',
          handler: () => {
            window.open(platformInfo.url, '_blank', 'noopener,noreferrer');
          },
        },
      ],
    });
    await alert.present();
  }

  async viewTeamMember(memberId: string): Promise<void> {
    const team: Record<
      string,
      { name: string; role: string; bio: string }
    > = {
      'dr-sarah': {
        name: 'Dr. Sarah Johnson',
        role: 'Chief Medical Officer',
        bio: "Leading our medical team with 15+ years of experience in women's health.",
      },
      'dr-michael': {
        name: 'Dr. Michael Chen',
        role: 'Head of Nutrition',
        bio: 'Specialized in pregnancy nutrition with a focus on personalized meal planning.',
      },
      'dr-emily': {
        name: 'Dr. Emily Rodriguez',
        role: 'Fitness Director',
        bio: 'Expert in prenatal fitness and safe exercise programs for expecting mothers.',
      },
      maria: {
        name: 'Maria Garcia',
        role: 'Community Manager',
        bio: 'Building and nurturing our supportive community of mothers and families.',
      },
    };

    const member = team[memberId];
    if (!member) {
      return;
    }

    const alert = await this.alertController.create({
      header: member.name,
      message: `${member.role}\n\n${member.bio}`,
      buttons: [
        { text: 'Close', role: 'cancel' },
        {
          text: 'Book consultation',
          handler: () => {
            void this.router.navigate(['/tabs/consultation']);
            void this.showToast('Opening consultations…');
          },
        },
      ],
    });
    await alert.present();
  }

  async learnMoreFeature(feature: string): Promise<void> {
    const features: Record<string, { title: string; description: string }> = {
      tracking: {
        title: 'Cycle & symptom tracking',
        description:
          'Log your cycle, symptoms, and patterns to see trends and reminders that match your body.',
      },
      consultation: {
        title: 'Expert consultations',
        description:
          'Connect with qualified professionals for personalized guidance when you need it.',
      },
      education: {
        title: 'Education library',
        description:
          'Courses and articles on pregnancy, nutrition, movement, mental wellness, and newborn care.',
      },
      community: {
        title: 'Community',
        description:
          'Meet others on similar journeys, share experiences, and learn together in a moderated space.',
      },
    };

    const featureInfo = features[feature];
    if (!featureInfo) {
      return;
    }

    const alert = await this.alertController.create({
      header: featureInfo.title,
      message: featureInfo.description,
      buttons: [
        { text: 'Close', role: 'cancel' },
        {
          text: 'Explore app',
          handler: () => {
            void this.router.navigate(['/tabs/home']);
          },
        },
      ],
    });
    await alert.present();
  }

  async viewPrivacyPolicy(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Privacy',
      message:
        'We take health data seriously: encryption in transit, clear controls, and practices aligned with how you use NouraCare. A full policy document can be linked from your legal team when ready.',
      buttons: [
        { text: 'Close', role: 'cancel' },
        {
          text: 'Learn more',
          handler: () => {
            void this.showToast('Full policy link can be added here.');
          },
        },
      ],
    });
    await alert.present();
  }

  async viewTermsOfService(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Terms of service',
      message:
        'These terms keep the community safe: acceptable use, service limits, and how disputes are handled. Your legal counsel can host the canonical document.',
      buttons: [
        { text: 'Close', role: 'cancel' },
        {
          text: 'Learn more',
          handler: () => {
            void this.showToast('Full terms link can be added here.');
          },
        },
      ],
    });
    await alert.present();
  }

  async openQuickMenu(): Promise<void> {
    const sheet = await this.actionSheetController.create({
      header: 'Quick actions',
      buttons: [
        {
          text: 'Contact support',
          handler: () => {
            void this.contactSupport();
          },
        },
        {
          text: 'Send feedback',
          handler: () => {
            void this.showToast('Feedback form can open here.');
          },
        },
        {
          text: 'Rate the app',
          handler: () => {
            void this.showToast('Store rating can open here.');
          },
        },
        {
          text: 'Share NouraCare',
          handler: () => {
            void this.router.navigate(['/invite-friends']);
          },
        },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
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
