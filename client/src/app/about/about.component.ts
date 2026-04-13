import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone.js';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: true,
  imports:[...SHARED_STANDALONE_IMPORTS],
  schemas:[CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
})
export class AboutComponent implements OnInit {

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {}

  // Contact Actions
  async contactSupport() {
    const alert = await this.alertController.create({
      header: 'Contact Support',
      message: 'How can we help you?\n\n• Technical issues\n• Account questions\n• Feature requests\n• General inquiries\n\nChoose your preferred contact method:',
      buttons: [
        {
          text: '📧 Email Support',
          handler: () => {
            this.showToast('Opening email client...', 'success');
          }
        },
        {
          text: '💬 Live Chat',
          handler: () => {
            this.showToast('Opening live chat...', 'success');
          }
        },
        {
          text: '📞 Call Us',
          handler: () => {
            this.showToast('Opening phone dialer...', 'success');
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  async followSocialMedia(platform: string) {
    const platforms = {
      'instagram': { name: 'Instagram', url: 'https://instagram.com/gahvare' },
      'facebook': { name: 'Facebook', url: 'https://facebook.com/gahvare' },
      'twitter': { name: 'Twitter', url: 'https://twitter.com/gahvare' },
      'youtube': { name: 'YouTube', url: 'https://youtube.com/gahvare' }
    };

    const platformInfo = platforms[platform as keyof typeof platforms];
    
    const alert = await this.alertController.create({
      header: `Follow us on ${platformInfo.name}`,
      message: `Stay updated with the latest news, tips, and community stories!\n\nWould you like to visit our ${platformInfo.name} page?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Visit Page',
          handler: () => {
            this.showToast(`Opening ${platformInfo.name}...`, 'success');
            // In a real app, you would use window.open(platformInfo.url)
          }
        }
      ]
    });

    await alert.present();
  }

  // Team Actions
  async viewTeamMember(memberId: string) {
    const team = {
      'dr-sarah': { 
        name: 'Dr. Sarah Johnson', 
        role: 'Chief Medical Officer',
        bio: 'Leading our medical team with 15+ years of experience in women\'s health.'
      },
      'dr-michael': { 
        name: 'Dr. Michael Chen', 
        role: 'Head of Nutrition',
        bio: 'Specialized in pregnancy nutrition with a focus on personalized meal planning.'
      },
      'dr-emily': { 
        name: 'Dr. Emily Rodriguez', 
        role: 'Fitness Director',
        bio: 'Expert in prenatal fitness and safe exercise programs for expecting mothers.'
      },
      'maria': { 
        name: 'Maria Garcia', 
        role: 'Community Manager',
        bio: 'Building and nurturing our supportive community of mothers and families.'
      }
    };

    const member = team[memberId as keyof typeof team];
    
    const alert = await this.alertController.create({
      header: member.name,
      message: `${member.role}\n\n${member.bio}\n\nWould you like to schedule a consultation with ${member.name}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Schedule Consultation',
          handler: () => {
            this.router.navigate(['/tabs/consultation']);
            this.showToast('Opening consultation booking...', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  // App Features
  async learnMoreFeature(feature: string) {
    const features = {
      'tracking': {
        title: 'Cycle & Symptom Tracking',
        description: 'Advanced tracking tools to monitor your fertility, symptoms, and overall health with detailed analytics and insights.'
      },
      'consultation': {
        title: 'Expert Consultations',
        description: 'Connect with certified healthcare professionals for personalized advice, nutrition guidance, and mental health support.'
      },
      'education': {
        title: 'Comprehensive Education',
        description: 'Access to expert-led courses covering pregnancy, nutrition, fitness, mental health, and newborn care.'
      },
      'community': {
        title: 'Supportive Community',
        description: 'Join a community of mothers and families sharing experiences, advice, and support throughout their journey.'
      }
    };

    const featureInfo = features[feature as keyof typeof features];
    
    const alert = await this.alertController.create({
      header: featureInfo.title,
      message: featureInfo.description,
      buttons: [
        {
          text: 'Try Feature',
          handler: () => {
            this.showToast('Opening feature...', 'success');
          }
        },
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  // App Info
  async viewPrivacyPolicy() {
    const alert = await this.alertController.create({
      header: 'Privacy Policy',
      message: 'Your privacy is our priority. We protect your personal health information with the highest security standards.\n\nKey points:\n• Data encryption\n• HIPAA compliance\n• User control\n• Transparent practices',
      buttons: [
        {
          text: 'Read Full Policy',
          handler: () => {
            this.showToast('Opening privacy policy...', 'success');
          }
        },
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  async viewTermsOfService() {
    const alert = await this.alertController.create({
      header: 'Terms of Service',
      message: 'Our terms ensure a safe and supportive environment for all users.\n\nKey terms:\n• User responsibilities\n• Service limitations\n• Intellectual property\n• Dispute resolution',
      buttons: [
        {
          text: 'Read Full Terms',
          handler: () => {
            this.showToast('Opening terms of service...', 'success');
          }
        },
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  // Quick Actions
  async openQuickMenu() {
    const actionSheet = await this.alertController.create({
      header: 'Quick Actions',
      buttons: [
        {
          text: '📞 Contact Support',
          handler: () => {
            this.contactSupport();
          }
        },
        {
          text: '📧 Send Feedback',
          handler: () => {
            this.showToast('Opening feedback form...', 'success');
          }
        },
        {
          text: '⭐ Rate App',
          handler: () => {
            this.showToast('Opening app store...', 'success');
          }
        },
        {
          text: '📱 Share App',
          handler: () => {
            this.showToast('Opening share dialog...', 'success');
          }
        },
        {
          text: '❌ Cancel',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  // Utility Methods
  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}
