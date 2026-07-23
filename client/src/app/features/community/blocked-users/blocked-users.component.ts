import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { User } from '@app/shared/services/user';
import { TranslationService } from '@app/shared/services/translation.service';
import { LanguageService } from '@app/shared/services/language.service';

@Component({
  selector: 'app-blocked-users',
  templateUrl: './blocked-users.component.html',
  styleUrls: ['./blocked-users.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
})
export class BlockedUsersComponent implements OnInit {
  private userService = inject(User);
  private router = inject(Router);
  private translation = inject(TranslationService);
  private languageService = inject(LanguageService);

  blockedUsers: any[] = [];
  isLoading = false;
  errorMessage = '';
  listTitle = '';

  ngOnInit() {
    this.languageService.currentLanguage$.subscribe(() => {
      this.refreshLabels();
    });
    this.loadBlockedUsers();
  }

  private refreshLabels(): void {
    this.listTitle = this.translation.translateParams('blockedUsers.listTitle', {
      count: this.blockedUsers.length,
    });
  }

  loadBlockedUsers() {
    this.isLoading = true;
    this.errorMessage = '';

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo?.user?.id;

    if (!userId) {
      this.errorMessage = this.translation.translate('blockedUsers.userNotFound');
      this.isLoading = false;
      return;
    }

    setTimeout(() => {
      this.blockedUsers = [
        {
          id: 1,
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          profileImage: null,
          blockedAt: '2024-01-15T10:30:00Z',
        },
        {
          id: 2,
          name: 'John Smith',
          email: 'john.smith@example.com',
          profileImage: null,
          blockedAt: '2024-01-10T14:20:00Z',
        },
      ];
      this.isLoading = false;
      this.refreshLabels();
    }, 1000);
  }

  unblockUser(userId: number) {
    this.blockedUsers = this.blockedUsers.filter((user) => user.id !== userId);
    this.refreshLabels();
    this.showSuccessAlert(this.translation.translate('blockedUsers.unblockedSuccess'));
  }

  goBack() {
    this.router.navigate(['/tabs']);
  }

  blockedOnLabel(dateString: string): string {
    return this.translation.translateParams('blockedUsers.blockedOn', {
      date: this.formatDate(dateString),
    });
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return this.translation.translate('blockedUsers.unknownDate');
      }

      const locale = this.languageService.getCurrentLanguage();
      return date.toLocaleDateString(locale === 'fa' ? 'fa-IR' : locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return this.translation.translate('blockedUsers.unknownDate');
    }
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement;
    if (target) {
      target.src = 'assets/images/nurse.png';
    }
  }

  private showSuccessAlert(message: string): void {
    const successDialog = document.createElement('div');
    successDialog.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    const messageElement = document.createElement('div');
    messageElement.textContent = `✅ ${message}`;
    messageElement.style.cssText = `
      font-size: 14px;
      font-weight: 500;
    `;

    successDialog.appendChild(messageElement);
    document.body.appendChild(successDialog);

    setTimeout(() => {
      if (successDialog.parentNode) {
        successDialog.remove();
      }
    }, 3000);
  }
}
