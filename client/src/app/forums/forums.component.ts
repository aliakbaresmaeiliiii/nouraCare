import { Component, OnInit, inject } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { Router } from '@angular/router';
import { ForumService } from '../shared/services/forum.service';

interface ForumCategory {
  id: number;
  name: string;
  description: string;
  icon: string;
  color: string;
  topicsCount: number;
  postsCount: number;
  lastActivity: string;
  isPopular: boolean;
}

interface ForumTopic {
  id: number;
  title: string;
  content: string;
  author: string;
  authorAvatar?: string;
  category: string;
  replies: number;
  views: number;
  lastReply: string;
  isPinned: boolean;
  isLocked: boolean;
  tags: string[];
  createdAt: string;
}

@Component({
  selector: 'app-forums',
  templateUrl: './forums.component.html',
  styleUrls: ['./forums.component.scss'],
  standalone: true,
  imports: [SharedModule],
})
export class ForumsComponent implements OnInit {
  private router = inject(Router);
  private forumsService = inject(ForumService);
  categories: ForumCategory[] = [];
  topics: ForumTopic[] = [];
  isLoading = false;
  errorMessage = '';
  searchQuery = '';
  selectedCategory = 'all';
  viewMode: 'categories' | 'topics' = 'categories';

  constructor() { }

  ngOnInit() {
    this.loadCategories();
    this.loadTopics();
    this.fetchCategories();
  }

  fetchCategories() {
    this.forumsService.getCategories().subscribe({
      next: (response: any) => {
        console.log(response);
        
        this.categories = response.data || [];
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
      }
    }); 
  }
  loadCategories() {
    this.isLoading = true;
    this.errorMessage = '';
  }

  loadTopics() {
    // TODO: Replace with actual API call when backend is ready
    // this.forumsService.getTopics().subscribe({
    //   next: (response: any) => {
    //     this.topics = response.data || [];
    //   },
    //   error: (error: any) => {
    //     console.error('Error loading topics:', error);
    //   }
    // });

    // Mock data for now
    this.topics = [
      {
        id: 1,
        title: 'Best natural remedies for period cramps',
        content: 'I\'ve been experiencing severe cramps lately and looking for natural remedies...',
        author: 'Sarah Johnson',
        authorAvatar: 'assets/images/nurse.png',
        category: 'General Discussion',
        replies: 23,
        views: 156,
        lastReply: '2024-01-15T10:30:00Z',
        isPinned: true,
        isLocked: false,
        tags: ['period', 'cramps', 'natural-remedies'],
        createdAt: '2024-01-10T14:20:00Z'
      },
      {
        id: 2,
        title: 'Pregnancy nutrition guide - what to eat and avoid',
        content: 'I\'m in my first trimester and want to make sure I\'m eating right...',
        author: 'Emily Chen',
        authorAvatar: 'assets/images/nurse.png',
        category: 'Pregnancy & Fertility',
        replies: 45,
        views: 289,
        lastReply: '2024-01-15T14:20:00Z',
        isPinned: false,
        isLocked: false,
        tags: ['pregnancy', 'nutrition', 'first-trimester'],
        createdAt: '2024-01-12T09:15:00Z'
      },
      {
        id: 3,
        title: 'Dealing with anxiety during pregnancy',
        content: 'I\'ve been feeling very anxious lately and it\'s affecting my sleep...',
        author: 'Maria Rodriguez',
        authorAvatar: 'assets/images/nurse.png',
        category: 'Mental Health',
        replies: 18,
        views: 134,
        lastReply: '2024-01-14T18:45:00Z',
        isPinned: false,
        isLocked: false,
        tags: ['anxiety', 'pregnancy', 'mental-health'],
        createdAt: '2024-01-13T11:30:00Z'
      }
    ];
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value || '';
  }

  onCategoryChange(category: string | number) {
    this.selectedCategory = category.toString();
  }

  switchViewMode(mode: string | number) {
    this.viewMode = (mode.toString() as 'categories' | 'topics');
  }

  openCategory(category: ForumCategory) {
    this.selectedCategory = category.name;
    this.viewMode = 'topics';
    // TODO: Load topics for this category
  }

  openTopic(topic: ForumTopic) {
    // Navigate to topic detail page
    this.router.navigate(['/forums/topic', topic.id]);
  }

  createNewTopic() {
    // TODO: Navigate to create topic page
    console.log('Create new topic');
  }

  get filteredCategories(): ForumCategory[] {
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      return this.categories.filter(category => 
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query)
      );
    }
    return this.categories;
  }

  get filteredTopics(): ForumTopic[] {
    let topics = this.topics;
    
    // Filter by category
    if (this.selectedCategory !== 'all') {
      topics = topics.filter(topic => topic.category === this.selectedCategory);
    }
    
    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      topics = topics.filter(topic => 
        topic.title.toLowerCase().includes(query) ||
        topic.content.toLowerCase().includes(query) ||
        topic.author.toLowerCase().includes(query) ||
        topic.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return topics;
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

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
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
