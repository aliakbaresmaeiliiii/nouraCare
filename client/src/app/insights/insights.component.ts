import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, ViewWillEnter } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { FavoritesService } from '../shared/services/favorites.service';
import { Subject, takeUntil, catchError, of, take } from 'rxjs';
import { TranslatePipe } from '../shared/pipes/translate.pipe';
import { TranslationService } from '../shared/services/translation.service';
import { LanguageService } from '../shared/services/language.service';
import {
  DEFAULT_SUBSCRIPTION_SUMMARY,
  SubscriptionService,
} from '../shared/services/subscription.service';

interface ArticleCard {
  id: string;
  titleKey: string;
  image: string;
  category: string;
  isPremium?: boolean;
  gradient?: string;
}

@Component({
  selector: 'app-insights',
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslatePipe],
  host: { class: 'ion-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsightsComponent implements OnInit, OnDestroy, ViewWillEnter {
  private destroy$ = new Subject<void>();
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly subscriptionService = inject(SubscriptionService);

  // Premium state (from subscription API)
  isPremiumUnlocked = false;

  // Article highlighting
  highlightedArticleId: string | null = null;

  // Premium banner
  premiumBanner = {
    title: '',
    isVisible: true,
  };

  searchQuery = signal('');

  /** Cached favorite article ids — avoids per-render Observable subscriptions. */
  private readonly favoriteIds = signal<Set<string>>(new Set());

  // Article sections
  pregnancyPopular: ArticleCard[] = [
    {
      id: '1',
      titleKey: 'insights.article.1',
      image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=300&fit=crop',
      category: 'pregnancy',
      isPremium: false,
      gradient: 'linear-gradient(135deg, #e8d5ff 0%, #d4a4ff 100%)'
    },
    {
      id: '2',
      titleKey: 'insights.article.2',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
      category: 'pregnancy',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #e0f4f3 0%, #b8e6e1 100%)'
    },
    {
      id: '3',
      titleKey: 'insights.article.3',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      category: 'pregnancy',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #fff2e0 0%, #ffe0b8 100%)'
    }
  ];

  pregnancySexPleasure: ArticleCard[] = [
    {
      id: '4',
      titleKey: 'insights.article.4',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop',
      category: 'intimacy',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #f0e6ff 0%, #d4a4ff 100%)'
    },
    {
      id: '5',
      titleKey: 'insights.article.5',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      category: 'intimacy',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #ffe6f0 0%, #ffb8d4 100%)'
    },
    {
      id: '6',
      titleKey: 'insights.article.6',
      image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop',
      category: 'intimacy',
      isPremium: false,
      gradient: 'linear-gradient(135deg, #e6f3ff 0%, #b8d4ff 100%)'
    }
  ];

  pregnancyBodySigns: ArticleCard[] = [
    {
      id: '7',
      titleKey: 'insights.article.7',
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=300&fit=crop',
      category: 'symptoms',
      isPremium: false,
      gradient: 'linear-gradient(135deg, #e6fff0 0%, #b8ffcc 100%)'
    },
    {
      id: '8',
      titleKey: 'insights.article.8',
      image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop',
      category: 'symptoms',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #fff0e6 0%, #ffccb8 100%)'
    },
    {
      id: '9',
      titleKey: 'insights.article.9',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      category: 'symptoms',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #f0ffe6 0%, #ccffb8 100%)'
    }
  ];

  // Nutrition articles
  nutritionNeedToKnow: ArticleCard[] = [
    {
      id: '10',
      titleKey: 'insights.article.10',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
      category: 'nutrition',
      isPremium: false,
      gradient: 'linear-gradient(135deg, #d4f1d4 0%, #a8e6a8 100%)'
    },
    {
      id: '11',
      titleKey: 'insights.article.11',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
      category: 'nutrition',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #f4e4d0 0%, #e6c8a0 100%)'
    },
    {
      id: '12',
      titleKey: 'insights.article.12',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      category: 'nutrition',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #fff0e6 0%, #ffccb8 100%)'
    }
  ];

  // Baby development articles
  allAboutYourBaby: ArticleCard[] = [
    {
      id: '13',
      titleKey: 'insights.article.13',
      image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=300&fit=crop',
      category: 'baby',
      isPremium: false,
      gradient: 'linear-gradient(135deg, #fde8e8 0%, #f7c6c6 100%)'
    },
    {
      id: '14',
      titleKey: 'insights.article.14',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
      category: 'baby',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #e8d5ff 0%, #d4a4ff 100%)'
    },
    {
      id: '15',
      titleKey: 'insights.article.15',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop',
      category: 'baby',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #e0f4f3 0%, #b8e6e1 100%)'
    }
  ];

  filteredArticles = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const match = (articles: ArticleCard[]) => {
      if (!q) {
        return articles;
      }
      return articles.filter((a) => {
        const title = this.translation.getTranslation(a.titleKey).toLowerCase();
        return title.includes(q) || a.category.toLowerCase().includes(q);
      });
    };
    return {
      nutritionNeedToKnow: match(this.nutritionNeedToKnow),
      allAboutYourBaby: match(this.allAboutYourBaby),
      pregnancyPopular: match(this.pregnancyPopular),
      pregnancySexPleasure: match(this.pregnancySexPleasure),
      pregnancyBodySigns: match(this.pregnancyBodySigns),
    };
  });

  hasActiveSearch = computed(() => this.searchQuery().trim().length > 0);

  hasAnySearchResults = computed(() => {
    const f = this.filteredArticles();
    return (
      f.nutritionNeedToKnow.length +
      f.allAboutYourBaby.length +
      f.pregnancyPopular.length +
      f.pregnancySexPleasure.length +
      f.pregnancyBodySigns.length
    ) > 0;
  });

   router = inject(Router);
  private favoritesService = inject(FavoritesService);
  private toastController = inject(ToastController);
  private activatedRoute = inject(ActivatedRoute);

  ngOnInit() {
    this.premiumBanner.title = this.translation.translate('insights.premiumBannerDefault');
    this.loadPremiumStatus();

    this.favoritesService
      .getFavorites()
      .pipe(takeUntil(this.destroy$))
      .subscribe((favorites) => {
        this.favoriteIds.set(new Set(favorites.map((f) => f.id)));
      });

    this.languageService.currentLanguage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.premiumBanner.title = this.translation.translate('insights.premiumBannerDefault');
        this.cdr.markForCheck();
      });

    // Check for query parameters to highlight specific articles
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['highlightArticle']) {
          this.highlightedArticleId = params['highlightArticle'];
          // Auto-scroll to the highlighted article after a short delay
          setTimeout(() => {
            this.scrollToHighlightedArticle();
          }, 500);
        }
      });
  }

  ionViewWillEnter(): void {
    this.loadPremiumStatus();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Close premium banner
  closePremiumBanner() {
    this.premiumBanner.isVisible = false;
  }

  openPremiumPage(): void {
    void this.router.navigate(['/nouracare-pro']);
  }

  private loadPremiumStatus(): void {
    this.subscriptionService
      .getSummary()
      .pipe(
        catchError(() => of(DEFAULT_SUBSCRIPTION_SUMMARY)),
        take(1),
      )
      .subscribe((summary) => {
        this.isPremiumUnlocked = summary.hasPremiumAccess;
        if (this.isPremiumUnlocked) {
          this.premiumBanner.isVisible = false;
        }
        this.cdr.markForCheck();
      });
  }

  onSearchInput(event: Event): void {
    const custom = event as CustomEvent<{ value?: string }>;
    this.searchQuery.set(custom.detail?.value ?? '');
  }

  onSearchClear(): void {
    this.searchQuery.set('');
  }

  // Open article (or premium paywall for locked content)
  openArticle(article: ArticleCard) {
    if (article.isPremium && !this.isPremiumUnlocked) {
      this.openPremiumPage();
      return;
    }
    void this.router.navigate(['/article', article.id]);
  }

  // Handle image error (apply fallback once to avoid error loops / flicker)
  handleImageError(event: Event, category: string) {
    const img = event.target as HTMLImageElement;
    if (!img || img.dataset['fallbackApplied'] === 'true') {
      return;
    }
    img.dataset['fallbackApplied'] = 'true';
    img.src = this.getFallbackImage(category);
  }

  // Get fallback image
  getFallbackImage(category: string): string {
    const fallbacks = {
      pregnancy: 'assets/images/image1.png',
      intimacy: 'assets/images/welcome2.png',
      symptoms: 'assets/images/bg-01.png',
      nutrition: 'assets/images/image1.png',
      baby: 'assets/images/welcome2.png',
    };
    return fallbacks[category as keyof typeof fallbacks] || 'assets/images/bg-01.png';
  }

  // Check if article is favorite
  isFavorite(articleId: string): boolean {
    return this.favoriteIds().has(articleId);
  }

  // Check if article should be highlighted
  isHighlighted(articleId: string): boolean {
    return this.highlightedArticleId === articleId;
  }

  // Scroll to highlighted article
  private scrollToHighlightedArticle() {
    if (this.highlightedArticleId) {
      const element = document.querySelector(`[data-article-id="${this.highlightedArticleId}"]`);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        // Add a temporary highlight effect
        element.classList.add('highlighted-article');
        setTimeout(() => {
          element.classList.remove('highlighted-article');
          this.highlightedArticleId = null;
        }, 3000);
      }
    }
  }

  // Toggle favorite status
  async toggleFavorite(article: ArticleCard, event: Event) {
    event.stopPropagation();
    
    const favoriteItem = {
      id: article.id,
      type: 'article' as const,
      title: this.translation.getTranslation(article.titleKey),
      description: `${article.category} article`,
      image: article.image,
      category: article.category,
      gradient: article.gradient,
      data: article
    };

    this.favoritesService.toggleFavorite(favoriteItem);
    
    const isNowFavorite = await this.checkIfFavorite(article.id);
    const message = isNowFavorite
      ? this.translation.translate('insights.favoriteAdded')
      : this.translation.translate('insights.favoriteRemoved');
    
    this.showToast(message);
  }

  private async checkIfFavorite(articleId: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.favoritesService.isFavorite(articleId).subscribe(isFav => {
        resolve(isFav);
      });
    });
  }

  private async showToast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  /** Pull-to-refresh on Insights tab (layout). */
  async runPullToRefresh(): Promise<void> {
    await new Promise((r) => setTimeout(r, 400));
  }

  async onTabPullRefresh(event: Event): Promise<void> {
    const target = event.target as HTMLIonRefresherElement;
    try {
      await this.runPullToRefresh();
    } catch {
      /* non-fatal */
    } finally {
      target.complete();
    }
  }
}
