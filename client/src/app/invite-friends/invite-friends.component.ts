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
import { TranslationService } from '../shared/services/translation.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

interface InviteMethod {
  id: string;
  titleKey: string;
  subtitleKey: string;
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
  private readonly translation = inject(TranslationService);

  readonly referralBonusPoints = 50;

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
        titleKey: 'inviteFriends.method.share.title',
        subtitleKey: 'inviteFriends.method.share.subtitle',
        icon: 'share-outline',
        accent: 'primary',
        action: () => this.shareApp(),
      },
      {
        id: 'email',
        titleKey: 'inviteFriends.method.email.title',
        subtitleKey: 'inviteFriends.method.email.subtitle',
        icon: 'mail-outline',
        accent: 'secondary',
        action: () => this.inviteViaEmail(),
      },
      {
        id: 'sms',
        titleKey: 'inviteFriends.method.sms.title',
        subtitleKey: 'inviteFriends.method.sms.subtitle',
        icon: 'chatbubble-ellipses-outline',
        accent: 'success',
        action: () => this.inviteViaSMS(),
      },
      {
        id: 'copy',
        titleKey: 'inviteFriends.method.copy.title',
        subtitleKey: 'inviteFriends.method.copy.subtitle',
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
          this.errorMessage = this.t('inviteFriends.loadFailed');
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
          `/auth/sign-in?ref=${encodeURIComponent(data.referralCode)}`,
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
    const text = this.tParams('inviteFriends.share.text', { link: this.inviteLink });
    if (navigator.share) {
      void navigator
        .share({
          title: this.t('inviteFriends.share.title'),
          text,
          url: this.inviteLink,
        })
        .then(() => void this.showToast(this.t('inviteFriends.toast.shared')))
        .catch(() => this.copyInviteLink());
    } else {
      this.copyInviteLink();
    }
  }

  inviteViaEmail(): void {
    const subject = encodeURIComponent(this.t('inviteFriends.email.subject'));
    const body = encodeURIComponent(
      this.tParams('inviteFriends.email.body', { link: this.inviteLink }),
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
    void this.showToast(this.t('inviteFriends.toast.emailOpened'));
  }

  inviteViaSMS(): void {
    const message = encodeURIComponent(
      this.tParams('inviteFriends.sms.body', { link: this.inviteLink }),
    );
    window.open(`sms:?body=${message}`);
    void this.showToast(this.t('inviteFriends.toast.messagesOpened'));
  }

  copyInviteLink(): void {
    const text = this.inviteLink || this.referralCode;
    if (!text) {
      void this.showToast(this.t('inviteFriends.toast.linkNotReady'));
      return;
    }
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(text).then(
        () => void this.showToast(this.t('inviteFriends.toast.linkCopied')),
        () => this.fallbackCopyTextToClipboard(text, 'inviteFriends.toast.linkCopied'),
      );
    } else {
      this.fallbackCopyTextToClipboard(text, 'inviteFriends.toast.linkCopied');
    }
  }

  copyCodeOnly(): void {
    if (!this.referralCode) {
      return;
    }
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(this.referralCode).then(
        () => void this.showToast(this.t('inviteFriends.toast.codeCopied')),
        () => this.fallbackCopyTextToClipboard(this.referralCode, 'inviteFriends.toast.codeCopied'),
      );
    } else {
      this.fallbackCopyTextToClipboard(this.referralCode, 'inviteFriends.toast.codeCopied');
    }
  }

  fallbackCopyTextToClipboard(text: string, successKey: string): void {
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
      void this.showToast(this.t(successKey));
    } catch {
      void this.showToast(this.t('inviteFriends.toast.copyFailed'));
    }
    document.body.removeChild(textArea);
  }

  toggleInviteHistory(): void {
    this.showInviteHistory = !this.showInviteHistory;
  }

  t(key: string): string {
    return this.translation.translate(key);
  }

  tParams(key: string, params: Record<string, string | number>): string {
    return this.translation.translateParams(key, params);
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
