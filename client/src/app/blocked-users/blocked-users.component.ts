import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { User } from '../shared/services/user';

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
  
  blockedUsers: any[] = [];
  isLoading = false;
  errorMessage = '';

  constructor() { }

  ngOnInit() {
    this.loadBlockedUsers();
  }

  loadBlockedUsers() {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Get user ID from localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const userId = userInfo?.user?.id;
    
    if (!userId) {
      this.errorMessage = 'User not found. Please login again.';
      this.isLoading = false;
      return;
    }

    // TODO: Replace with actual API call when backend is ready
    // this.userService.getBlockedUsers(userId).subscribe({
    //   next: (response: any) => {
    //     this.blockedUsers = response.data || [];
    //     this.isLoading = false;
    //   },
    //   error: (error: any) => {
    //     console.error('Error loading blocked users:', error);
    //     this.errorMessage = 'Failed to load blocked users. Please try again.';
    //     this.isLoading = false;
    //   }
    // });

    // Mock data for now
    setTimeout(() => {
      this.blockedUsers = [
        {
          id: 1,
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
          profileImage: null,
          blockedAt: '2024-01-15T10:30:00Z'
        },
        {
          id: 2,
          name: 'John Smith',
          email: 'john.smith@example.com',
          profileImage: null,
          blockedAt: '2024-01-10T14:20:00Z'
        }
      ];
      this.isLoading = false;
    }, 1000);
  }

  unblockUser(userId: number) {
    // TODO: Replace with actual API call when backend is ready
    // this.userService.unblockUser(userId).subscribe({
    //   next: (response: any) => {
    //     this.showSuccessAlert('User unblocked successfully!');
    //     this.loadBlockedUsers(); // Reload the list
    //   },
    //   error: (error: any) => {
    //     console.error('Error unblocking user:', error);
    //     this.showErrorAlert('Failed to unblock user. Please try again.');
    //   }
    // });

    // Mock unblock for now
    this.blockedUsers = this.blockedUsers.filter(user => user.id !== userId);
    this.showSuccessAlert('User unblocked successfully!');
  }

  goBack() {
    this.router.navigate(['/tabs']);
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown date';
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

  private showErrorAlert(message: string): void {
    const errorDialog = document.createElement('div');
    errorDialog.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #c21e56;
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
    messageElement.textContent = `❌ ${message}`;
    messageElement.style.cssText = `
      font-size: 14px;
      font-weight: 500;
    `;

    errorDialog.appendChild(messageElement);
    document.body.appendChild(errorDialog);

    setTimeout(() => {
      if (errorDialog.parentNode) {
        errorDialog.remove();
      }
    }, 5000);
  }
}
