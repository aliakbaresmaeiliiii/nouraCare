import { Component, OnInit, inject, signal } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { Router } from '@angular/router';
import { ForumService } from '../shared/services/forum.service';
import { ForumThreadsService } from '../shared/services/forum-threads.service';

interface ForumCategory {
  id: string;
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
  id: string;
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
  private forumThreadsService = inject(ForumThreadsService);

  categories = signal<ForumCategory[]>([]) || [];

  topics: ForumTopic[] = [];
  isLoading = false;
  errorMessage = '';
  searchQuery = '';
  selectedCategory = 'all';
  viewMode: 'categories' | 'topics' = 'categories';

  constructor() {}

  ngOnInit() {
    this.loadCategories();
    this.loadTopics();
    this.fetchCategories();
  }

  fetchCategories() {
    this.forumsService.getCategories().subscribe({
      next: (response: any) => {
        console.log('Categories response:', response);
        if (response && response.success) {
          this.isLoading = false;
          // Map the backend data to our frontend interface
          const categories = response.data.map((category: any) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            icon: category.icon,
            color: category.color,
            topicsCount: category.forums?.length || 0,
            postsCount: 0, // This would need to be calculated from forums data
            lastActivity: category.updatedAt,
            isPopular: false // You can set this based on some criteria
          }));
          this.categories.set(categories);
        }
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
      },
    });
  }
  loadCategories() {
    this.isLoading = true;
    this.errorMessage = '';
  }

  loadTopics() {
    this.forumThreadsService.getAllThreads().subscribe({
      next: (response: any) => {
        console.log('Forum threads response:', response);
        if (response && response.success) {
          this.isLoading = false;
          // Map the backend data to our frontend interface
          const threads = response.data.threads.map((thread: any) => ({
            id: thread.id,
            title: thread.title,
            content: thread.content,
            author: thread.author?.name || 'Anonymous',
            authorAvatar: thread.author?.avatar || 'assets/images/nurse.png',
            category: thread.category?.name || 'General Discussion',
            replies: thread.repliesCount || 0,
            views: thread.views || 0,
            lastReply: thread.updatedAt,
            isPinned: thread.isPinned || false,
            isLocked: thread.isLocked || false,
            tags: thread.tags || [],
            createdAt: thread.createdAt
          }));
          this.topics = threads;
        }
      },
      error: (error: any) => {
        console.error('Error loading topics:', error);
        this.isLoading = false;
      },
    });
    // Mock data for now
    // this.topics = [
    //   {
    //     id: 1,
    //     title: 'Best natural remedies for period cramps',
    //     content:
    //       "I've been experiencing severe cramps lately and looking for natural remedies...",
    //     author: 'Sarah Johnson',
    //     authorAvatar: 'assets/images/nurse.png',
    //     category: 'General Discussion',
    //     replies: 23,
    //     views: 156,
    //     lastReply: '2025-09-21T10:30:00Z',
    //     isPinned: true,
    //     isLocked: false,
    //     tags: ['period', 'cramps', 'natural-remedies'],
    //     createdAt: '2025-09-22',
    //   },
    //   {
    //     id: 2,
    //     title: 'Pregnancy nutrition guide - what to eat and avoid',
    //     content:
    //       "I'm in my first trimester and want to make sure I'm eating right...",
    //     author: 'Emily Chen',
    //     authorAvatar: 'assets/images/nurse.png',
    //     category: 'Pregnancy & Fertility',
    //     replies: 45,
    //     views: 289,
    //     lastReply: '2025-09-22T14:20:00Z',
    //     isPinned: false,
    //     isLocked: false,
    //     tags: ['pregnancy', 'nutrition', 'first-trimester'],
    //      createdAt: '2025-09-22',

    //   },
    //   {
    //     id: 3,
    //     title: 'Dealing with anxiety during pregnancy',
    //     content:
    //       "I've been feeling very anxious lately and it's affecting my sleep...",
    //     author: 'Maria Rodriguez',
    //     authorAvatar: 'assets/images/nurse.png',
    //     category: 'Mental Health',
    //     replies: 18,
    //     views: 134,
    //     lastReply: '2024-01-14T18:45:00Z',
    //     isPinned: false,
    //     isLocked: false,
    //     tags: ['anxiety', 'pregnancy', 'mental-health'],
    //     createdAt: '2024-01-13T11:30:00Z',
    //   },
    // ];
  }

  onSearchChange(event: any) {
    this.searchQuery = event.detail.value || '';
  }

  onCategoryChange(category: string | number) {
    const categoryId = category.toString();
    this.selectedCategory = categoryId;
    
    if (categoryId === 'all') {
      this.loadTopics();
    } else {
      this.loadTopicsByCategory(categoryId);
    }
  }

  switchViewMode(mode: string | number) {
    this.viewMode = mode.toString() as 'categories' | 'topics';
    if (this.viewMode === 'topics') {
      if (this.selectedCategory === 'all') {
        this.loadTopics();
      } else {
        this.loadTopicsByCategory(this.selectedCategory);
      }
    }
  }

  openCategory(category: ForumCategory) {
    this.selectedCategory = category.id;
    this.viewMode = 'topics';
    this.loadTopicsByCategory(category.id);
  }

  loadTopicsByCategory(categoryId: string) {
    this.isLoading = true;
    this.forumThreadsService.getThreadsByCategory(categoryId).subscribe({
      next: (response: any) => {
        console.log('Category threads response:', response);
        if (response && response.success) {
          this.isLoading = false;
          // Map the backend data to our frontend interface
          const threads = response.data.threads.map((thread: any) => ({
            id: thread.id,
            title: thread.title,
            content: thread.content,
            author: thread.author?.name || 'Anonymous',
            authorAvatar: thread.author?.avatar || 'assets/images/nurse.png',
            category: thread.category?.name || 'General Discussion',
            replies: thread.repliesCount || 0,
            views: thread.views || 0,
            lastReply: thread.updatedAt,
            isPinned: thread.isPinned || false,
            isLocked: thread.isLocked || false,
            tags: thread.tags || [],
            createdAt: thread.createdAt
          }));
          this.topics = threads;
        }
      },
      error: (error: any) => {
        console.error('Error loading category topics:', error);
        this.isLoading = false;
      },
    });
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
      return this.categories().filter(
        (category) =>
          category.name.toLowerCase().includes(query) ||
          category.description.toLowerCase().includes(query)
      );
    }
    return this.categories();
  }

  get filteredTopics(): ForumTopic[] {
    let topics = this.topics;

    // Filter by category (when category is selected by ID)
    if (this.selectedCategory !== 'all') {
      // Since we're now using category ID for selection, we need to handle this differently
      // For now, we'll just return all topics when a specific category is selected
      // as the backend should already be filtering by category
      return topics;
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      topics = topics.filter(
        (topic) =>
          topic.title.toLowerCase().includes(query) ||
          topic.content.toLowerCase().includes(query) ||
          topic.author.toLowerCase().includes(query) ||
          topic.tags.some((tag) => tag.toLowerCase().includes(query))
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

  getCategoryIcon(categoryName: string): string {
    const iconMap: { [key: string]: string } = {
      'General Discussion': 'chatbubbles-outline',
      'Pregnancy & Fertility': 'heart-outline',
      'Mental Health': 'happy-outline',
      'Health & Wellness': 'fitness-outline',
      Relationships: 'people-outline',
      Nutrition: 'nutrition-outline',
      Exercise: 'barbell-outline',
      Parenting: 'people-circle-outline',
      'Medical Questions': 'medical-outline',
      'Support Groups': 'people-circle-outline',
      'Trying to conceive': 'heart-outline',
      'Pregnancy tests': 'flask-outline',
      Ovulation: 'calendar-outline',
      Pregnancy: 'female-outline',
      '1st trimester': 'leaf-outline',
      '2nd trimester': 'flower-outline',
      '3rd trimester': 'rose-outline',
      Parenthood: 'baby-carriage-outline',
      Postpartum: 'refresh-outline',
    };

    // Return the mapped icon or a default icon
    return iconMap[categoryName] || 'help-circle-outline';
  }

  clearFilters(): void {
    this.selectedCategory = 'all';
    this.searchQuery = '';
  }

  getSelectedCategoryName(): string {
    if (this.selectedCategory === 'all') {
      return 'All Topics';
    }
    const category = this.categories().find(c => c.id === this.selectedCategory);
    return category?.name || this.selectedCategory;
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
