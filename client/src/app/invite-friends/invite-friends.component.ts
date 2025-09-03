import { Component, OnInit, inject } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { Router } from '@angular/router';

interface InviteMethod {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  action: () => void;
}

interface InviteHistory {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  method: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: string;
  avatar?: string;
}

@Component({
  selector: 'app-invite-friends',
  templateUrl: './invite-friends.component.html',
  styleUrls: ['./invite-friends.component.scss'],
  standalone: true,
  imports: [SharedModule],
})
export class InviteFriendsComponent implements OnInit {
  private router = inject(Router);

  isLoading = false;
  errorMessage = '';
  showInviteHistory = false;

  inviteMethods: InviteMethod[] = [
    {
      id: 'share',
      title: 'Share App Link',
      subtitle: 'Share via any app',
      icon: 'share-outline',
      color: 'primary',
      action: () => this.shareApp()
    },
    {
      id: 'email',
      title: 'Send Email',
      subtitle: 'Invite via email',
      icon: 'mail-outline',
      color: 'secondary',
      action: () => this.inviteViaEmail()
    },
    {
      id: 'sms',
      title: 'Send SMS',
      subtitle: 'Invite via text message',
      icon: 'chatbubble-outline',
      color: 'success',
      action: () => this.inviteViaSMS()
    },
    {
      id: 'copy',
      title: 'Copy Link',
      subtitle: 'Copy invitation link',
      icon: 'copy-outline',
      color: 'warning',
      action: () => this.copyInviteLink()
    },
    {
      id: 'qr',
      title: 'QR Code',
      subtitle: 'Show QR code to scan',
      icon: 'qr-code-outline',
      color: 'tertiary',
      action: () => this.showQRCode()
    }
  ];

  inviteHistory: InviteHistory[] = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      method: 'Email',
      status: 'accepted',
      invitedAt: '2024-01-15T10:30:00Z',
      avatar: 'assets/images/avatar1.jpg'
    },
    {
      id: 2,
      name: 'Mike Chen',
      phone: '+1-555-0123',
      method: 'SMS',
      status: 'pending',
      invitedAt: '2024-01-14T15:45:00Z',
      avatar: 'assets/images/avatar2.jpg'
    },
    {
      id: 3,
      name: 'Emma Davis',
      email: 'emma.d@email.com',
      method: 'Share',
      status: 'declined',
      invitedAt: '2024-01-13T09:15:00Z',
      avatar: 'assets/images/avatar3.jpg'
    },
    {
      id: 4,
      name: 'Alex Rodriguez',
      phone: '+1-555-0456',
      method: 'SMS',
      status: 'accepted',
      invitedAt: '2024-01-12T14:20:00Z',
      avatar: 'assets/images/avatar4.jpg'
    }
  ];

  constructor() { }

  ngOnInit() {
    this.loadInviteHistory();
  }

  loadInviteHistory() {
    this.isLoading = true;
    // Simulate loading invite history from API
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  onInviteMethodClick(method: InviteMethod) {
    method.action();
  }

  shareApp() {
    if (navigator.share) {
      navigator.share({
        title: 'Join me on Gahvareh',
        text: 'I think you\'d love Gahvareh! It\'s a great app for women\'s health and wellness.',
        url: 'https://gahvareh.com/invite?ref=user123'
      }).then(() => {
        this.showSuccessAlert('App shared successfully!');
      }).catch((error) => {
        console.log('Error sharing:', error);
        this.copyInviteLink();
      });
    } else {
      this.copyInviteLink();
    }
  }

  inviteViaEmail() {
    const subject = encodeURIComponent('Join me on Gahvareh!');
    const body = encodeURIComponent(
      'Hi!\n\nI think you\'d love Gahvareh! It\'s a great app for women\'s health and wellness.\n\n' +
      'Download it here: https://gahvareh.com/invite?ref=user123\n\n' +
      'Best regards,\n[Your Name]'
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
    this.showSuccessAlert('Email client opened. Please send the invitation.');
  }

  inviteViaSMS() {
    const message = encodeURIComponent(
      'Hi! I think you\'d love Gahvareh! Download it here: https://gahvareh.com/invite?ref=user123'
    );
    window.open(`sms:?body=${message}`);
    this.showSuccessAlert('SMS app opened. Please send the invitation.');
  }

  copyInviteLink() {
    const inviteLink = 'https://gahvareh.com/invite?ref=user123';
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink).then(() => {
        this.showSuccessAlert('Invitation link copied to clipboard!');
      }).catch(() => {
        this.fallbackCopyTextToClipboard(inviteLink);
      });
    } else {
      this.fallbackCopyTextToClipboard(inviteLink);
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
      this.showSuccessAlert('Invitation link copied to clipboard!');
    } catch (err) {
      this.showErrorAlert('Failed to copy link. Please try again.');
    }
    
    document.body.removeChild(textArea);
  }

  showQRCode() {
    // In a real app, this would show a modal with QR code
    this.showSuccessAlert('QR code feature coming soon!');
  }

  toggleInviteHistory() {
    this.showInviteHistory = !this.showInviteHistory;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'accepted': return 'success';
      case 'pending': return 'warning';
      case 'declined': return 'danger';
      default: return 'medium';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'accepted': return 'Accepted';
      case 'pending': return 'Pending';
      case 'declined': return 'Declined';
      default: return 'Unknown';
    }
  }

  get acceptedInvites(): number {
    return this.inviteHistory.filter(h => h.status === 'accepted').length;
  }

  get pendingInvites(): number {
    return this.inviteHistory.filter(h => h.status === 'pending').length;
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      return 'Unknown date';
    }
  }

  goBack() {
    this.router.navigate(['/tabs']);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/images/nurse.png';
    }
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
