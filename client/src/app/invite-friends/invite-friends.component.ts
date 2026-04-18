import { Component, OnInit, inject } from '@angular/core';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  chatbubbleEllipsesOutline,
  chevronForwardOutline,
  closeCircleOutline,
  copyOutline,
  informationCircleOutline,
  mailOutline,
  shareOutline,
} from 'ionicons/icons';
import type { RefresherCustomEvent } from '@ionic/core';
import { ToastController } from '@ionic/angular/standalone';
import { catchError, finalize, of } from 'rxjs';
import { GrowthService } from '../shared/services/growth.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

interface InviteMethod {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  /** Ionic color name — used for icon well accents only (cards stay surface-based). */
  accent: 'primary' | 'secondary' | 'success' | 'warning';
  action: () => void;
}

@Component({
  selector: 'app-invite-friends',
  templateUrl: './invite-friends.component.html',
  styleUrls: ['./invite-friends.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class InviteFriendsComponent implements OnInit {
  private readonly growth = inject(GrowthService);
  private readonly toastController = inject(ToastController);

  isLoading = false;
  errorMessage = '';
  showInviteHistory = false;

  referralCode = '';
  inviteLink = '';
  growthPoints = 0;
  successfulReferrals = 0;

  inviteMethods: InviteMethod[] = [];

  constructor() {
    addIcons({
      alertCircleOutline,
      chatbubbleEllipsesOutline,
      chevronForwardOutline,
      closeCircleOutline,
      copyOutline,
      informationCircleOutline,
      mailOutline,
      shareOutline,
    });
  }

  ngOnInit(): void {
    this.inviteMethods = [
      {
        id: 'share',
        title: 'Share app link',
        subtitle: 'Use your device share sheet',
        icon: 'share-outline',
        accent: 'primary',
        action: () => this.shareApp(),
      },
      {
        id: 'email',
        title: 'Send email',
        subtitle: 'Pre-filled message you can edit',
        icon: 'mail-outline',
        accent: 'secondary',
        action: () => this.inviteViaEmail(),
      },
      {
        id: 'sms',
        title: 'Send SMS',
        subtitle: 'Opens your messaging app',
        icon: 'chatbubble-ellipses-outline',
        accent: 'success',
        action: () => this.inviteViaSMS(),
      },
      {
        id: 'copy',
        title: 'Copy link',
        subtitle: 'Put the invite URL on the clipboard',
        icon: 'copy-outline',
        accent: 'warning',
        action: () => this.copyInviteLink(),
      },
    ];
    this.loadGrowth();
  }

  loadGrowth(onComplete?: () => void): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.growth
      .getSummary()
      .pipe(
        catchError(() => {
          this.errorMessage =
            'Could not load your invite code. Pull down to refresh or try again later.';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
          onComplete?.();
        }),
      )
      .subscribe((data) => {
        if (!data) {
          return;
        }
        this.referralCode = data.referralCode;
        this.growthPoints = data.growthPoints;
        this.successfulReferrals = data.successfulReferrals;
        this.inviteLink = this.growth.buildInviteUrl(
          `/welcome?ref=${encodeURIComponent(data.referralCode)}`,
        );
      });
  }

  onRefresh(event: RefresherCustomEvent): void {
    this.loadGrowth(() => event.detail.complete());
  }

  onInviteMethodClick(method: InviteMethod): void {
    method.action();
  }

  shareApp(): void {
    const text = `Join me on NouraCare — smarter cycle & pregnancy support.\n\n${this.inviteLink}`;
    if (navigator.share) {
      void navigator
        .share({
          title: 'Join me on NouraCare',
          text,
          url: this.inviteLink,
        })
        .then(() => void this.showToast('Shared'))
        .catch(() => this.copyInviteLink());
    } else {
      this.copyInviteLink();
    }
  }

  inviteViaEmail(): void {
    const subject = encodeURIComponent('Join me on NouraCare!');
    const body = encodeURIComponent(
      `Hi!\n\nI'm using NouraCare for cycle insights and daily check-ins. When you sign up with my link, we both earn reward points in the app.\n\n${this.inviteLink}\n\n`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
    void this.showToast('Email composer opened');
  }

  inviteViaSMS(): void {
    const message = encodeURIComponent(
      `Join me on NouraCare — we both get bonus points if you use my link: ${this.inviteLink}`,
    );
    window.open(`sms:?body=${message}`);
    void this.showToast('Messages opened');
  }

  copyInviteLink(): void {
    const text = this.inviteLink || this.referralCode;
    if (!text) {
      void this.showToast('Invite link is not ready yet.');
      return;
    }
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).then(
        () => void this.showToast('Invitation link copied'),
        () => this.fallbackCopyTextToClipboard(text),
      );
    } else {
      this.fallbackCopyTextToClipboard(text);
    }
  }

  copyCodeOnly(): void {
    if (!this.referralCode) {
      return;
    }
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(this.referralCode).then(
        () => void this.showToast('Code copied'),
        () => this.fallbackCopyTextToClipboard(this.referralCode),
      );
    } else {
      this.fallbackCopyTextToClipboard(this.referralCode);
    }
  }

  fallbackCopyTextToClipboard(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      void this.showToast('Copied to clipboard');
    } catch {
      void this.showToast('Could not copy automatically.');
    }
    document.body.removeChild(textArea);
  }

  toggleInviteHistory(): void {
    this.showInviteHistory = !this.showInviteHistory;
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom',
    });
    await toast.present();
  }
}
