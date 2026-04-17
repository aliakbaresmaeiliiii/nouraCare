import { Component, OnInit, inject } from '@angular/core';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { Router } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import { GrowthService } from '../shared/services/growth.service';

interface InviteMethod {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  action: () => void;
}

@Component({
  selector: 'app-invite-friends',
  templateUrl: './invite-friends.component.html',
  styleUrls: ['./invite-friends.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
})
export class InviteFriendsComponent implements OnInit {
  private router = inject(Router);
  private growth = inject(GrowthService);

  isLoading = false;
  errorMessage = '';
  showInviteHistory = false;

  referralCode = '';
  inviteLink = '';
  growthPoints = 0;
  successfulReferrals = 0;

  inviteMethods: InviteMethod[] = [];

  ngOnInit() {
    this.inviteMethods = [
      {
        id: 'share',
        title: 'Share App Link',
        subtitle: 'Share via any app',
        icon: 'share-outline',
        color: 'primary',
        action: () => this.shareApp(),
      },
      {
        id: 'email',
        title: 'Send Email',
        subtitle: 'Invite via email',
        icon: 'mail-outline',
        color: 'secondary',
        action: () => this.inviteViaEmail(),
      },
      {
        id: 'sms',
        title: 'Send SMS',
        subtitle: 'Invite via text message',
        icon: 'chatbubble-outline',
        color: 'success',
        action: () => this.inviteViaSMS(),
      },
      {
        id: 'copy',
        title: 'Copy Link',
        subtitle: 'Copy invitation link',
        icon: 'copy-outline',
        color: 'warning',
        action: () => this.copyInviteLink(),
      },
    ];
    this.loadGrowth();
  }

  loadGrowth() {
    this.isLoading = true;
    this.errorMessage = '';
    this.growth
      .getSummary()
      .pipe(
        catchError(() => {
          this.errorMessage = 'Could not load your invite code. Pull to try again.';
          return of(null);
        }),
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe((data) => {
        if (!data) {
          return;
        }
        this.referralCode = data.referralCode;
        this.growthPoints = data.growthPoints;
        this.successfulReferrals = data.successfulReferrals;
        this.inviteLink = this.growth.buildInviteUrl(`/welcome?ref=${encodeURIComponent(data.referralCode)}`);
      });
  }

  onInviteMethodClick(method: InviteMethod) {
    method.action();
  }

  shareApp() {
    const text =
      `Join me on NouraCare — smarter cycle & pregnancy support.\n\n${this.inviteLink}`;
    if (navigator.share) {
      navigator
        .share({
          title: 'Join me on NouraCare',
          text,
          url: this.inviteLink,
        })
        .then(() => this.showSuccessAlert('Shared!'))
        .catch(() => this.copyInviteLink());
    } else {
      this.copyInviteLink();
    }
  }

  inviteViaEmail() {
    const subject = encodeURIComponent('Join me on NouraCare!');
    const body = encodeURIComponent(
      `Hi!\n\nI'm using NouraCare for cycle insights and daily check-ins. When you sign up with my link, we both earn reward points in the app.\n\n${this.inviteLink}\n\n`,
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
    this.showSuccessAlert('Email opened — send when you are ready.');
  }

  inviteViaSMS() {
    const message = encodeURIComponent(
      `Join me on NouraCare — we both get bonus points if you use my link: ${this.inviteLink}`,
    );
    window.open(`sms:?body=${message}`);
    this.showSuccessAlert('Messages opened — send when you are ready.');
  }

  copyInviteLink() {
    const text = this.inviteLink || this.referralCode;
    if (!text) {
      this.showErrorAlert('Invite link is not ready yet.');
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.inviteLink).then(
        () => this.showSuccessAlert('Invitation link copied!'),
        () => this.fallbackCopyTextToClipboard(this.inviteLink),
      );
    } else {
      this.fallbackCopyTextToClipboard(this.inviteLink);
    }
  }

  copyCodeOnly() {
    if (!this.referralCode) {
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.referralCode).then(
        () => this.showSuccessAlert('Code copied!'),
        () => this.fallbackCopyTextToClipboard(this.referralCode),
      );
    } else {
      this.fallbackCopyTextToClipboard(this.referralCode);
    }
  }

  fallbackCopyTextToClipboard(text: string) {
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
      this.showSuccessAlert('Copied to clipboard!');
    } catch {
      this.showErrorAlert('Could not copy. Try again.');
    }
    document.body.removeChild(textArea);
  }

  toggleInviteHistory() {
    this.showInviteHistory = !this.showInviteHistory;
  }

  goBack() {
    this.router.navigate(['/tabs']);
  }

  private showSuccessAlert(message: string): void {
    const alert = document.createElement('ion-alert');
    alert.header = 'Success';
    alert.message = message;
    alert.buttons = ['OK'];
    document.body.appendChild(alert);
    alert.present();
  }

  private showErrorAlert(message: string): void {
    const alert = document.createElement('ion-alert');
    alert.header = 'Error';
    alert.message = message;
    alert.buttons = ['OK'];
    document.body.appendChild(alert);
    alert.present();
  }
}
