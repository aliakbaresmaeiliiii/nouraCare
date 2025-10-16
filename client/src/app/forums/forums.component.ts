import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil
} from 'rxjs';
import { ForumService } from '../shared/services/forum.service';
import { SharedModule } from '../shared/shared-module';

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
export class ForumsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private forumsService = inject(ForumService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Advanced state management with signals
  categories = signal<ForumCategory[]>([]);
  topics = signal<ForumTopic[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  searchQuery = signal('');
  selectedCategory = signal('all');
  viewMode = signal<'categories' | 'topics'>('categories');

  // Cache for category-specific topics
  private topicsCache = new Map<string, ForumTopic[]>();

  // Computed properties for reactive filtering
  filteredCategories = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const categories = this.categories();
    if (!query) return categories;

    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.description.toLowerCase().includes(query)
    );
  });

  filteredTopics = computed(() => {
    const topics = this.topics();
    const query = this.searchQuery().toLowerCase().trim();

    if (!query) return topics;

    return topics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(query) ||
        topic.content.toLowerCase().includes(query) ||
        topic.author.toLowerCase().includes(query) ||
        topic.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  selectedCategoryName = computed(() => {
    const selectedId = this.selectedCategory();
    if (selectedId === 'all') return 'All Topics';

    const category = this.categories().find((c) => c.id === selectedId);
    return category?.name || selectedId;
  });

  constructor() {
    // Setup debounced search
    this.setupSearchDebounce();
  }

  ngOnInit() {
    this.fetchDataCategories();
    // this.loadTopics();
    this.handleQueryParams();
    this.setupPostDeletionListener();
    this.setupPostCreationListener();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchSubject.complete();
  }

  // Public methods for immediate UI updates
  addNewTopic(topicData: any): void {
    const newTopic: ForumTopic = {
      id: topicData.id,
      title: topicData.title,
      content: topicData.content,
      author: topicData.author?.name || 'Anonymous',
      authorAvatar:
        topicData.author?.profileImage || '/assets/images/nurse.png',
      category: topicData.category?.name || 'General Discussion',
      replies: 0,
      views: 0,
      lastReply: topicData.createdAt,
      isPinned: false,
      isLocked: false,
      tags: topicData.tags || [],
      createdAt: topicData.createdAt,
    };

    // Add to the beginning of the topics list
    this.topics.update((topics) => [newTopic, ...topics]);

    // Clear cache to ensure fresh data on next load
    this.topicsCache.clear();

    // Show notification
    this.showSuccessAlert('New post created!');
  }

  // removeTopic(postId: string): void {
  //   // Remove the post from the topics list
  //   this.topics.update(topics => {
  //     const filteredTopics = topics.filter(topic => topic.id !== postId);
  //     return filteredTopics;
  //   });

  //   // Clear cache to ensure fresh data on next load
  //   this.topicsCache.clear();
  //   debugger;
  //   // Show notification
  //   this.showSuccessAlert('Post deleted!');
  // }

  private setupSearchDebounce() {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((query) => {
        this.searchQuery.set(query);
      });
  }

  private handleQueryParams() {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const categoryId = params['category'];
        const view = params['view'];

        if (categoryId && categoryId !== 'all') {
          // Set the selected category
          this.selectedCategory.set(categoryId);

          // Switch to topics view if specified
          if (view === 'topics') {
            this.viewMode.set('topics');
          }

          // Load topics for the selected category
          this.loadTopicsByCategory(categoryId);
        }
      });
  }

  fetchDataCategories() {
    this.isLoading.set(true);
    this.forumsService.getCategories().subscribe({
      next: (response: any) => {
        console.log('Categories response:', response);
        if (response && response.success) {
          this.isLoading.set(false);
          // Map the backend data to our frontend interface
          const categories = response.data.map((category: any) => ({
            id: category.id,
            name: category.name,
            description: category.description,
            icon: category.icon,
            color: category.color,
            topicsCount: category.forums?.length || 0,
            forum: category.forums?.[0] || null,
            postsCount: 0, // This would need to be calculated from forums data
            lastActivity: category.updatedAt,
            isPopular: false, // You can set this based on some criteria
          }));
          // Update both service store and component signal
          this.forumsService.setStoreDataCategory(categories);
          this.categories.set(categories);
        }
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        this.isLoading.set(false);
        this.errorMessage.set('Failed to load categories');
      },
    });
  }

  loadCategories() {
    this.isLoading.set(true);
    this.errorMessage.set('');
  }

  loadTopics() {
    this.isLoading.set(true);
    this.errorMessage.set('');


    // Check cache first
    const cachedTopics = this.topicsCache.get('all');
    if (cachedTopics) {
      this.topics.set(cachedTopics);
      this.isLoading.set(false);
      return;
    }
    this.forumsService.getAllThreads().subscribe({
      next: (response: any) => {
        console.log('Forum threads response:', response);
        if (response && response.success) {
          this.isLoading.set(false);
          // Map the backend data to our frontend interface
          const threads = response.data.threads.map((thread: any) => ({
            id: thread.id,
            title: thread.title,
            content: thread.content,
            author: thread.author?.name || 'Anonymous',
            authorAvatar: thread.author?.avatar || '/assets/images/nurse.png',
            category: thread.category?.name || 'General Discussion',
            replies: thread.repliesCount || 0,
            views: thread.views || 0,
            lastReply: thread.updatedAt,
            isPinned: thread.isPinned || false,
            isLocked: thread.isLocked || false,
            tags: thread.tags || [],
            createdAt: thread.createdAt,
          }));
          this.topics.set(threads);
          this.topicsCache.set('all', threads);
        }
      },
      error: (error: any) => {
        console.error('Error loading topics:', error);
        this.isLoading.set(false);
        this.errorMessage.set('Failed to load topics');
      },
    });
  }

  onSearchChange(event: any) {
    const query = event.detail.value || '';
    this.searchSubject.next(query);
  }

  onCategoryChange(category: string | number) {
    const categoryId = category.toString();
    this.selectedCategory.set(categoryId);

    if (categoryId === 'all') {
      this.loadTopics();
    } else {
      this.loadTopicsByCategory(categoryId);
    }
  }

  switchViewMode(mode: string | number) {
    this.viewMode.set(mode.toString() as 'categories' | 'topics');
    if (this.viewMode() === 'topics') {
      if (this.selectedCategory() === 'all') {
        this.loadTopics();
      } else {
        this.loadTopicsByCategory(this.selectedCategory());
      }
    }
  }

  openCategory(category: ForumCategory) {
    this.selectedCategory.set(category.id);
    this.viewMode.set('topics');
    this.loadTopicsByCategory(category.id);
  }

  loadTopicsByCategory(categoryId: string) {
    this.isLoading.set(true);
    this.errorMessage.set('');

    // Check cache first
    const cachedTopics = this.topicsCache.get(categoryId);
    if (cachedTopics) {
      this.topics.set(cachedTopics);
      this.isLoading.set(false);
      return;
    }

    this.forumsService.getThreadsByCategory(categoryId).subscribe({
      next: (response: any) => {
        if (response && response.success) {
          this.isLoading.set(false);
          // Map the backend data to our frontend interface
          const threads = response.data.threads.map((thread: any) => ({
            id: thread.id,
            title: thread.title,
            content: thread.content,
            author: thread.author?.name || 'Anonymous',
            authorAvatar: thread.author?.avatar || '/assets/images/nurse.png',
            category: thread.category?.name || 'General Discussion',
            replies: thread.repliesCount || 0,
            views: thread.views || 0,
            lastReply: thread.updatedAt,
            isPinned: thread.isPinned || false,
            isLocked: thread.isLocked || false,
            tags: thread.tags || [],
            createdAt: thread.createdAt,
          }));
          this.topics.set(threads);
          this.topicsCache.set(categoryId, threads);
        } else {
          // If API returns success but no data, treat as empty category
          this.isLoading.set(false);
          this.topics.set([]);
          this.topicsCache.set(categoryId, []);
        }
      },
      error: (error: any) => {
        console.error('Error loading category topics:', error);
        this.isLoading.set(false);
        
        // For 404 or empty responses, treat as empty category instead of error
        if (error.status === 404 || error.status === 400) {
          this.topics.set([]);
          this.topicsCache.set(categoryId, []);
          this.errorMessage.set('');
        } else {
          this.errorMessage.set('Failed to load topics for this category');
        }
      },
    });
  }

  openTopic(topic: ForumTopic) {
    // Navigate to topic detail page
    this.router.navigate(['/forums/topic', topic.id]);
  }

  createNewTopic(categoryId?: string) {
    if (categoryId) {
      // Navigate to create-post with category ID as query parameter
      this.router.navigate(['/forums/create-post'], {
        queryParams: { category: categoryId }
      });
    } else {
      this.router.navigate(['/forums/create-post']);
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
      target.src = '/assets/images/nurse.png';
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
    this.selectedCategory.set('all');
    this.searchQuery.set('');
    this.loadTopics();
  }

  refreshData(): void {
    // Clear cache and reload
    this.topicsCache.clear();
    if (this.selectedCategory() === 'all') {
      this.loadTopics();
    } else {
      this.loadTopicsByCategory(this.selectedCategory());
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

  private setupPostDeletionListener(): void {
    this.forumsService.postDeleted$
      .pipe(takeUntil(this.destroy$))
      .subscribe((postId: string) => {
        console.log('🔄 Forums: Post deletion detected, refreshing list...');
        // Remove the deleted post from the current list
        // this.removeTopic(postId);
        // Also refresh the data to ensure we have the latest state
        this.refreshData();
      });
  }

  private setupPostCreationListener(): void {
    // Refresh the data to include the new post
    this.refreshData();
    this.forumsService.postCreated.set(false);
  }
}
