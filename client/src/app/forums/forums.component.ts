import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
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
  lastValueFrom,
  takeUntil,
} from 'rxjs';
import { ForumService } from '../shared/services/forum.service';
import { TranslationService } from '../shared/services/translation.service';
import { ForumCategoryMapperService } from '../shared/services/forum-category-mapper.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { ForumCategory, ForumTopic } from '../shared/models/forum';

@Component({
  selector: 'app-forums',
  templateUrl: './forums.component.html',
  styleUrls: ['./forums.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ForumsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private forumsService = inject(ForumService);
  private readonly translation = inject(TranslationService);
  private readonly categoryMapper = inject(ForumCategoryMapperService);
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

  readonly categorySelectOptions = {
    header: '',
    subHeader: '',
  };

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
        category.description.toLowerCase().includes(query) ||
        this.categoryMapper.translateName(category).toLowerCase().includes(query) ||
        this.categoryMapper
          .translateDescription(category)
          .toLowerCase()
          .includes(query)
    );
  });

  filteredTopics = computed(() => {
    const topics = this.topics();
    const query = this.searchQuery().toLowerCase().trim();

    if (!query) return topics;

    return topics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(query) ||
        topic.comment.toLowerCase().includes(query) ||
        topic.author.toLowerCase().includes(query) ||
        topic.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  });

  selectedCategoryName = computed(() => {
    const selectedId = this.selectedCategory();
    if (selectedId === 'all') return this.t('forums.allTopics');

    const category = this.categories().find((c) => c.id === selectedId);
    return category
      ? this.categoryMapper.translateName(category)
      : this.categoryMapper.translateName(selectedId);
  });

  selectedCategoryObject = computed(() => {
    const selectedId = this.selectedCategory();
    if (selectedId === 'all') return null;
    return this.categories().find((c) => c.id === selectedId) ?? null;
  });

  selectedCategoryIcon = computed(() => {
    if (this.selectedCategory() === 'all') {
      return 'chatbubbles-outline';
    }
    const category = this.selectedCategoryObject();
    return category ? this.categoryMapper.getIcon(category) : 'chatbubbles-outline';
  });

  constructor() {
    // Setup debounced search
    this.setupSearchDebounce();
  }

  ngOnInit() {
    this.categorySelectOptions.header = this.t('forums.selectCategory');
    this.categorySelectOptions.subHeader = this.t('forums.selectCategoryHint');
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
      comment: topicData.description,
      author: topicData.author?.name || this.t('forums.anonymous'),
      authorAvatar:
        topicData.author?.profileImage || '/assets/images/nurse.png',
      category: topicData.category?.name || this.t('forums.generalDiscussion'),
      replies: 0,
      viewCount: 0,
      lastReply: topicData.createdAt,
      isPinned: false,
      isLocked: false,
      tags: topicData.tags || [],
      user: topicData.user,
      forumId: topicData.forumId,
      createdAt: topicData.createdAt,
      forumPosts:topicData.forumPosts
    };

    // Add to the beginning of the topics list
    this.topics.update((topics) => [newTopic, ...topics]);

    // Clear cache to ensure fresh data on next load
    this.topicsCache.clear();

    // Show notification
    this.showSuccessAlert(this.t('forums.success.newPost'));
  }

  private mapThreadToTopic(thread: any): ForumTopic {
    const user = thread.user || {};
    const recentComments = Array.isArray(thread.comments) ? thread.comments : [];
    return {
      id: thread.id,
      title: thread.title || this.t('forums.untitled'),
      comment: thread.content || thread.description || '',
      author: user.fullName || this.t('forums.anonymous'),
      authorAvatar:
        user?.user_profile?.avatarUrl ||
        user.profileImage ||
        '/assets/images/nurse.png',
      category: thread.category?.name || this.t('forums.generalDiscussion'),
      categoryId: thread.categoryId,
      replies: thread.commentCount ?? thread.repliesCount ?? 0,
      viewCount: thread.viewCount ?? thread.viewCount ?? 0,
      lastReply: thread.updatedAt || thread.createdAt,
      isPinned: thread.isPinned || false,
      isLocked: thread.isLocked || false,
      likeCount: thread.likeCount ?? 0,
      tags: thread.tags || [],
      user: {
        id: user.id || 0,
        fullName: user.fullName || this.t('forums.anonymous'),
        profileImage:
          user?.user_profile?.avatarUrl || user.profileImage || '',
      },
      createdAt: thread.createdAt,
      forumId: thread.forumId || '',
      forumPosts: thread.forumPosts || [],
      recentComments: recentComments.map((comment: any) => ({
        id: comment.id,
        comment: comment.comment || '',
        createdAt: comment.createdAt,
      })),
    };
  }

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

  private applyCategoriesFromApiResponse(response: any): void {
    if (response?.success === true) {
      const categories = response.data.map((category: any) => ({
        id: category.id,
        name: category.name,
        description: category.description,
        slug: category.slug,
        icon: category.icon,
        color: category.color,
        topicsCount: category.forums?.length || 0,
        forum: category.forums?.[0] || null,
        postsCount: 0,
        lastActivity: category.updatedAt,
        viewCount: category.viewCount || 0,
        isPopular: false,
      }));
      this.forumsService.setStoreDataCategory(categories);
      this.categories.set(categories);
    }
  }

  fetchDataCategories() {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.forumsService.getCategories().subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        this.applyCategoriesFromApiResponse(response);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set(this.t('forums.error.loadCategories'));
      },
    });
  }

  async onForumsPullRefresh(event: Event): Promise<void> {
    const target = event.target as HTMLIonRefresherElement;
    try {
      this.errorMessage.set('');
      const response: any = await lastValueFrom(this.forumsService.getCategories());
      this.applyCategoriesFromApiResponse(response);
      if (this.viewMode() === 'topics') {
        const sel = this.selectedCategory();
        this.topicsCache.delete('all');
        if (sel !== 'all') {
          this.topicsCache.delete(sel);
        }
        await this.refreshTopicsForCurrentViewSilent();
      }
    } catch {
      this.errorMessage.set(this.t('forums.error.refresh'));
    } finally {
      target.complete();
    }
  }

  private async refreshTopicsForCurrentViewSilent(): Promise<void> {
    const sel = this.selectedCategory();
    try {
      if (sel === 'all') {
        const response: any = await lastValueFrom(this.forumsService.getAllThreads());
        if (response?.success && response.data?.threads) {
          const threads = response.data.threads.map((thread: any) => ({
            ...this.mapThreadToTopic(thread),
          }));
          this.topics.set(threads);
          this.topicsCache.set('all', threads);
        }
      } else {
        const response: any = await lastValueFrom(
          this.forumsService.getThreadsByCategory(sel),
        );
        if (response?.success && response.data?.threads) {
          const threads = response.data.threads.map((thread: any) => ({
            ...this.mapThreadToTopic(thread),
          }));
          this.topics.set(threads);
          this.topicsCache.set(sel, threads);
          this.forumsService.setStoreDataThread(threads);
        } else {
          this.topics.set([]);
          this.topicsCache.set(sel, []);
        }
      }
    } catch {
      /* keep list; pull-to-refresh is best-effort */
    }
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
        if (response && response.success) {
          this.isLoading.set(false);
          // Map the backend data to our frontend interface
          const threads = response.data.threads.map((thread: any) => ({
            ...this.mapThreadToTopic(thread),
          }));
          this.topics.set(threads);
          this.topicsCache.set('all', threads);
        }
      },
      error: (error: any) => {
        console.error('Error loading topics:', error);
        this.isLoading.set(false);
        this.errorMessage.set(this.t('forums.error.loadTopics'));
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

  viewAllTopics(): void {
    this.selectedCategory.set('all');
    this.viewMode.set('topics');
    this.loadTopics();
  }

  goToCategoriesView(): void {
    this.viewMode.set('categories');
    this.searchQuery.set('');
  }

  clearSearch(): void {
    this.searchQuery.set('');
  }

  topicsCountLabel(): string {
    const count = this.filteredTopics().length;
    return this.tParams('forums.topicsCount', { count });
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
            ...this.mapThreadToTopic(thread),
          }));
          this.topics.set(threads);
          this.topicsCache.set(categoryId, threads);
          this.forumsService.setStoreDataThread(threads);

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
          this.errorMessage.set(this.t('forums.error.loadCategoryTopics'));
        }
      },
    });
  }

  openTopic(topic: ForumTopic) {
    const categoryId = this.selectedCategory();
    const nextViews = (Number(topic.viewCount) || 0) + 1;
    const updatedTopic: ForumTopic = {
      ...topic,
      viewCount: nextViews,
    };

    // Optimistic UI update in list (real increment is persisted in topic detail API call).
    this.topics.update((items) =>
      items.map((item) => (item.id === topic.id ? updatedTopic : item))
    );
    if (categoryId && categoryId !== 'all') {
      const cached = this.topicsCache.get(categoryId) || [];
      this.topicsCache.set(
        categoryId,
        cached.map((item) => (item.id === topic.id ? updatedTopic : item))
      );
    }
    this.forumsService.setStoreDataThread(this.topics());

    // Create a topic object with categoryId included
    const topicWithCategory = {
      ...updatedTopic,
      categoryId: categoryId,
    };
    this.forumsService.setTopicDetail(topicWithCategory);
    this.router.navigate(['/forums/topic', topic.id]);
  }

  createNewTopic(categoryId?: string) {
    if (categoryId) {
      // Navigate to create-post with category ID as query parameter
      this.router.navigate(['/forums/create-post'], {
        queryParams: { category: categoryId },
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
        return diffDays === 1
          ? this.t('forums.time.yesterday')
          : this.tParams('forums.time.daysAgo', { days: diffDays });
      }
      if (diffHours > 0) {
        return diffHours === 1
          ? this.t('forums.time.oneHourAgo')
          : this.tParams('forums.time.hoursAgo', { hours: diffHours });
      }
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return diffMinutes < 1
        ? this.t('forums.time.justNow')
        : this.tParams('forums.time.minutesAgo', { minutes: diffMinutes });
    } catch {
      return this.t('forums.time.recently');
    }
  }

  createFirstTopicLabel(category: string): string {
    return this.tParams('forums.createFirstTopic', { category });
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }

  private tParams(
    key: string,
    params: Record<string, string | number>,
  ): string {
    return this.translation.translateParams(key, params);
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

  getCategoryIcon(category: ForumCategory | string): string {
    return this.categoryMapper.getIcon(category);
  }

  categoryName(category: ForumCategory): string {
    return this.categoryMapper.translateName(category);
  }

  categoryDescription(category: ForumCategory): string {
    return this.categoryMapper.translateDescription(category);
  }

  topicCategoryLabel(topic: ForumTopic): string {
    if (topic.categoryId) {
      const match = this.categories().find((c) => c.id === topic.categoryId);
      if (match) {
        return this.categoryMapper.translateName(match);
      }
    }
    return this.categoryMapper.translateName(topic.category);
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
