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
import { ToastController, ViewWillEnter } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { FavoritesService } from '@app/shared/services/favorites.service';
import { Subject, takeUntil, catchError, of, take } from 'rxjs';
import { TranslationService } from '@app/shared/services/translation.service';
import { LanguageService } from '@app/shared/services/language.service';
import {
  DEFAULT_SUBSCRIPTION_SUMMARY,
  SubscriptionService,
} from '@app/shared/services/subscription.service';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';

interface ArticleCard {
  id: string;
  titleKey: string;
  image: string;
  category: string;
  isPremium?: boolean;
  gradient?: string;
}

interface ArticleSection {
  id: string;
  titleKey: string;
  articles: ArticleCard[];
}

@Component({
  selector: 'app-insights',
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsightsComponent implements OnInit, OnDestroy, ViewWillEnter {
  private destroy$ = new Subject<void>();
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly subscriptionService = inject(SubscriptionService);

  isPremiumUnlocked = false;
  highlightedArticleId: string | null = null;

  premiumBanner = {
    title: '',
    isVisible: true,
  };

  searchQuery = signal('');
  private readonly favoriteIds = signal<Set<string>>(new Set());

  readonly articleCatalog: ArticleSection[] = [
    {
      id: 'nutrition',
      titleKey: 'insights.sectionNutrition',
      articles: [
        {
          id: '10',
          titleKey: 'insights.article.10',
          image:
            'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
          category: 'nutrition',
          isPremium: false,
          gradient: 'linear-gradient(135deg, #d4f1d4 0%, #a8e6a8 100%)',
        },
        {
          id: '11',
          titleKey: 'insights.article.11',
          image:
            'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
          category: 'nutrition',
          isPremium: true,
          gradient: 'linear-gradient(135deg, #f4e4d0 0%, #e6c8a0 100%)',
        },
        {
          id: '12',
          titleKey: 'insights.article.12',
          image:
            'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
          category: 'nutrition',
          isPremium: true,
          gradient: 'linear-gradient(135deg, #fff0e6 0%, #ffccb8 100%)',
        },
      ],
    },
    {
      id: 'baby',
      titleKey: 'insights.sectionBaby',
      articles: [
        {
          id: '13',
          titleKey: 'insights.article.13',
          image:
            'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=300&fit=crop',
          category: 'baby',
          isPremium: false,
          gradient: 'linear-gradient(135deg, #fde8e8 0%, #f7c6c6 100%)',
        },
        {
          id: '14',
          titleKey: 'insights.article.14',
          image:
            'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
          category: 'baby',
          isPremium: true,
          gradient: 'linear-gradient(135deg, #e8d5ff 0%, #d4a4ff 100%)',
        },
        {
          id: '15',
          titleKey: 'insights.article.15',
          image:
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop',
          category: 'baby',
          isPremium: true,
          gradient: 'linear-gradient(135deg, #e0f4f3 0%, #b8e6e1 100%)',
        },
      ],
    },
    {
      id: 'popular',
      titleKey: 'insights.sectionPregnancyPopular',
      articles: [
        {
          id: '1',
          titleKey: 'insights.article.1',
          image:
            'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=300&fit=crop',
          category: 'pregnancy',
          isPremium: false,
          gradient: 'linear-gradient(135deg, #e8d5ff 0%, #d4a4ff 100%)',
        },
        {
          id: '2',
          titleKey: 'insights.article.2',
          image:
            'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
          category: 'pregnancy',
          isPremium: true,
          gradient: 'linear-gradient(135deg, #e0f4f3 0%, #b8e6e1 100%)',
        },
        {
          id: '3',
          titleKey: 'insights.article.3',
          image:
            'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
          category: 'pregnancy',
          isPremium: true,
          gradient: 'linear-gradient(135deg, #fff2e0 0%, #ffe0b8 100%)',
        },
      ],
    },
    {
      id: 'intimacy',
      titleKey: 'insights.sectionSexPleasure',
      articles: [
        {
          id: '4',
          titleKey: 'insights.article.4',
          image:
            'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop',
          category: 'intimacy',
          isPremium: true,
          gradient: 'linear-gradient(135deg, #f0e6ff 0%, #d4a4ff 100%)',
        },
        {
          id: '5',
          titleKey: 'insights.article.5',
          image:
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
          category: 'intimacy',
          isPremium: true,
          gradient: 'linear-gradient(135deg, #ffe6f0 0%, #ffb8d4 100%)',
        },
        {
          id: '6',
          titleKey: 'insights.article.6',
          image:
            'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop',
          category: 'intimacy',
          isPremium: false,
          gradient: 'linear-gradient(135deg, #e6f3ff 0%, #b8d4ff 100%)',
        },
      ],
    },
    {
      id: 'symptoms',
      titleKey: 'insights.sectionBodySigns',
      articles: [
        {
          id: '7',
          titleKey: 'insights.article.7',
          image:
            'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=300&fit=crop',
          category: 'symptoms',
          isPremium: false,
          gradient: 'linear-gradient(135deg, #e6fff0 0%, #b8ffcc 100%)',
        },
        {
          id: '8',
          titleKey: 'insights.article.8',
          image:
            'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop',
          category: 'symptoms',
          isPremium: true,
          gradient: 'linear-gradient(135deg, #fff0e6 0%, #ffccb8 100%)',
        },
        {
          id: '9',
          titleKey: 'insights.article.9',
          image:
            'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
          category: 'symptoms',
          isPremium: true,
          gradient: 'linear-gradient(135deg, #f0ffe6 0%, #ccffb8 100%)',
        },
      ],
    },
  ];

  filteredSections = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    return this.articleCatalog
      .map((section) => ({
        ...section,
        articles: q
          ? section.articles.filter((a) => {
              const title = this.translation
                .getTranslation(a.titleKey)
                .toLowerCase();
              return (
                title.includes(q) || a.category.toLowerCase().includes(q)
              );
            })
          : section.articles,
      }))
      .filter((section) => section.articles.length > 0);
  });

  hasActiveSearch = computed(() => this.searchQuery().trim().length > 0);

  hasAnySearchResults = computed(() =>
    this.filteredSections().some((s) => s.articles.length > 0),
  );

  readonly router = inject(Router);
  private favoritesService = inject(FavoritesService);
  private toastController = inject(ToastController);
  private activatedRoute = inject(ActivatedRoute);

  ngOnInit() {
    this.premiumBanner.title = this.translation.translate(
      'insights.premiumBannerDefault',
    );
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
        this.premiumBanner.title = this.translation.translate(
          'insights.premiumBannerDefault',
        );
        this.cdr.markForCheck();
      });

    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        if (params['highlightArticle']) {
          this.highlightedArticleId = params['highlightArticle'];
          setTimeout(() => this.scrollToHighlightedArticle(), 500);
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

  closePremiumBanner(): void {
    this.premiumBanner.isVisible = false;
    this.cdr.markForCheck();
  }

  openPremiumPage(): void {
    void this.router.navigate(['/dorehealth-pro']);
  }

  openFavorites(): void {
    void this.router.navigate(['/my-favorites']);
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

  openArticle(article: ArticleCard): void {
    if (article.isPremium && !this.isPremiumUnlocked) {
      this.openPremiumPage();
      return;
    }
    void this.router.navigate(['/article', article.id]);
  }

  handleImageError(event: Event, category: string): void {
    const img = event.target as HTMLImageElement;
    if (!img || img.dataset['fallbackApplied'] === 'true') {
      return;
    }
    img.dataset['fallbackApplied'] = 'true';
    img.src = this.getFallbackImage(category);
  }

  getFallbackImage(category: string): string {
    const fallbacks = {
      pregnancy: 'assets/images/welcome2.jpg',
      intimacy: 'assets/images/welcome2.jpg',
      symptoms: 'assets/images/bg-01.png',
      nutrition: 'assets/images/welcome2.jpg',
      baby: 'assets/images/welcome2.jpg',
    };
    return (
      fallbacks[category as keyof typeof fallbacks] || 'assets/images/bg-01.png'
    );
  }

  isFavorite(articleId: string): boolean {
    return this.favoriteIds().has(articleId);
  }

  isHighlighted(articleId: string): boolean {
    return this.highlightedArticleId === articleId;
  }

  private scrollToHighlightedArticle(): void {
    if (!this.highlightedArticleId) {
      return;
    }
    const element = document.querySelector(
      `[data-article-id="${this.highlightedArticleId}"]`,
    );
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('highlighted-article');
      setTimeout(() => {
        element.classList.remove('highlighted-article');
        this.highlightedArticleId = null;
        this.cdr.markForCheck();
      }, 3000);
    }
  }

  async toggleFavorite(article: ArticleCard, event: Event): Promise<void> {
    event.stopPropagation();

    const favoriteItem = {
      id: article.id,
      type: 'article' as const,
      title: this.translation.getTranslation(article.titleKey),
      description: `${article.category} article`,
      image: article.image,
      category: article.category,
      gradient: article.gradient,
      data: article,
    };

    this.favoritesService.toggleFavorite(favoriteItem);

    const isNowFavorite = await this.checkIfFavorite(article.id);
    const message = isNowFavorite
      ? this.translation.translate('insights.favoriteAdded')
      : this.translation.translate('insights.favoriteRemoved');

    await this.showToast(message);
  }

  private async checkIfFavorite(articleId: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.favoritesService.isFavorite(articleId).subscribe((isFav) => {
        resolve(isFav);
      });
    });
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success',
    });
    await toast.present();
  }

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
