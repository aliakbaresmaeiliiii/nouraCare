import { Component, OnInit, inject } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { Router } from '@angular/router';

interface Friend {
  id: number;
  name: string;
  profileImage?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  mutualFriends: number;
  isFavorite: boolean;
  isBlocked: boolean;
  joinedDate: string;
  bio?: string;
}

@Component({
  selector: 'app-my-friends',
  templateUrl: './my-friends.component.html',
  styleUrls: ['./my-friends.component.scss'],
  standalone: true,
  imports: [SharedModule],
})
export class MyFriendsComponent implements OnInit {
  private router = inject(Router);
  
  friends: Friend[] = [];
  isLoading = false;
  errorMessage = '';
  searchQuery = '';
  selectedFilter = 'all';

  filters = [
    { value: 'all', label: 'All Friends', icon: 'people-outline' },
    { value: 'online', label: 'Online', icon: 'radio-button-on-outline' },
    { value: 'favorites', label: 'Favorites', icon: 'heart-outline' },
    { value: 'recent', label: 'Recent', icon: 'time-outline' }
  ];

  constructor() { }

  ngOnInit() {
    this.loadFriends();
  }

  loadFriends() {
    this.isLoading = true;
    this.errorMessage = '';
    
    // TODO: Replace with actual API call when backend is ready
    // this.friendsService.getFriends().subscribe({
    //   next: (response: any) => {
    //     this.friends = response.data || [];
    //     this.isLoading = false;
    //   },
    //   error: (error: any) => {
    //     console.error('Error loading friends:', error);
    //     this.errorMessage = 'Failed to load friends. Please try again.';
    //     this.isLoading = false;
    //   }
    // });

    // Mock data for now
    setTimeout(() => {
      this.friends = [
        {
          id: 1,
          name: 'Sarah Johnson',
          profileImage: 'assets/images/nurse.png',
          status: 'online',
          mutualFriends: 12,
          isFavorite: true,
          isBlocked: false,
          joinedDate: '2023-06-15T10:30:00Z',
          bio: 'Health enthusiast and yoga lover'
        },
        {
          id: 2,
          name: 'Emily Chen',
          profileImage: 'assets/images/nurse.png',
          status: 'away',
          lastSeen: '2024-01-15T14:20:00Z',
          mutualFriends: 8,
          isFavorite: false,
          isBlocked: false,
          joinedDate: '2023-08-22T09:15:00Z',
          bio: 'Nutrition specialist and wellness coach'
        },
        {
          id: 3,
          name: 'Maria Rodriguez',
          profileImage: 'assets/images/nurse.png',
          status: 'offline',
          lastSeen: '2024-01-14T18:45:00Z',
          mutualFriends: 15,
          isFavorite: true,
          isBlocked: false,
          joinedDate: '2023-05-10T16:20:00Z',
          bio: 'Fitness trainer and health advocate'
        },
        {
          id: 4,
          name: 'Lisa Thompson',
          profileImage: 'assets/images/nurse.png',
          status: 'online',
          mutualFriends: 6,
          isFavorite: false,
          isBlocked: false,
          joinedDate: '2023-09-05T11:00:00Z',
          bio: 'Mental health counselor'
        },
        {
          id: 5,
          name: 'Jennifer Kim',
          profileImage: 'assets/images/nurse.png',
          status: 'offline',
          lastSeen: '2024-01-13T20:30:00Z',
          mutualFriends: 9,
          isFavorite: false,
          isBlocked: false,
          joinedDate: '2023-07-18T13:45:00Z',
          bio: 'Dance instructor and wellness blogger'
        }
      ];
      this.isLoading = false;
    }, 1000);
  }

  onFilterChange(filter: string | number) {
    this.selectedFilter = filter.toString();
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value || '';
  }

  toggleFavorite(friendId: number) {
    const friend = this.friends.find(f => f.id === friendId);
    if (friend) {
      friend.isFavorite = !friend.isFavorite;
      // TODO: Update via API
      this.showSuccessAlert(friend.isFavorite ? 'Added to favorites' : 'Removed from favorites');
    }
  }

  blockFriend(friendId: number) {
    const friend = this.friends.find(f => f.id === friendId);
    if (friend) {
      friend.isBlocked = true;
      // TODO: Update via API
      this.showSuccessAlert('Friend blocked successfully');
    }
  }

  unblockFriend(friendId: number) {
    const friend = this.friends.find(f => f.id === friendId);
    if (friend) {
      friend.isBlocked = false;
      // TODO: Update via API
      this.showSuccessAlert('Friend unblocked successfully');
    }
  }

  removeFriend(friendId: number) {
    // TODO: Replace with actual API call when backend is ready
    // this.friendsService.removeFriend(friendId).subscribe({
    //   next: (response: any) => {
    //     this.showSuccessAlert('Friend removed successfully');
    //     this.loadFriends();
    //   },
    //   error: (error: any) => {
    //     console.error('Error removing friend:', error);
    //     this.showErrorAlert('Failed to remove friend. Please try again.');
    //   }
    // });

    // Mock removal for now
    this.friends = this.friends.filter(friend => friend.id !== friendId);
    this.showSuccessAlert('Friend removed successfully');
  }

  openFriendProfile(friend: Friend) {
    // TODO: Navigate to friend's profile page
    console.log('Opening friend profile:', friend);
  }

  get filteredFriends(): Friend[] {
    let friends = this.friends;
    
    // Filter by status
    if (this.selectedFilter === 'online') {
      friends = friends.filter(friend => friend.status === 'online');
    } else if (this.selectedFilter === 'favorites') {
      friends = friends.filter(friend => friend.isFavorite);
    } else if (this.selectedFilter === 'recent') {
      // Sort by last activity (online friends first, then by last seen)
      friends = friends.sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (b.status === 'online' && a.status !== 'online') return 1;
        if (a.lastSeen && b.lastSeen) {
          return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
        }
        return 0;
      });
    }
    
    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      friends = friends.filter(friend => 
        friend.name.toLowerCase().includes(query) ||
        friend.bio?.toLowerCase().includes(query)
      );
    }
    
    return friends;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'online': return '#10b981';
      case 'away': return '#f59e0b';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  }

  getStatusText(status: string, lastSeen?: string): string {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': 
        return lastSeen ? `Last seen ${this.formatRelativeTime(lastSeen)}` : 'Offline';
      default: return 'Unknown';
    }
  }

  formatRelativeTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffDays > 0) {
        return diffDays === 1 ? 'yesterday' : `${diffDays} days ago`;
      } else if (diffHours > 0) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
      } else {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return diffMinutes < 1 ? 'just now' : `${diffMinutes} minutes ago`;
      }
    } catch (error) {
      return 'recently';
    }
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Unknown date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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
    messageElement.innerHTML = `✅ ${message}`;
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
      background: #f44336;
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
    messageElement.innerHTML = `❌ ${message}`;
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
