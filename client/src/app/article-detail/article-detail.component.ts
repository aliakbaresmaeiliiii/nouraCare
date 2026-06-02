import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { FavoritesService } from '../shared/services/favorites.service';
import { ArticleContentService } from '../shared/services/article-content.service';
import { TranslationService } from '../shared/services/translation.service';
import { LanguageService } from '../shared/services/language.service';
import { LogoLoadingComponent } from '../shared/components/logo-loading/logo-loading.component';
import { TranslatePipe } from '../shared/pipes/translate.pipe';
import {
  ARTICLE_CATEGORY_BY_ID,
  ARTICLE_IMAGE_BY_ID,
} from '../shared/content/article-translations.content';
import type { ArticleContent } from './article.types';

const CATEGORY_GRADIENT: Record<string, string> = {
  pregnancy: 'linear-gradient(135deg, #e8d5ff 0%, #c4b5fd 100%)',
  intimacy: 'linear-gradient(135deg, #fce7f3 0%, #f9a8d4 100%)',
  symptoms: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 100%)',
  nutrition: 'linear-gradient(135deg, #fef3c7 0%, #fcd34d 100%)',
  baby: 'linear-gradient(135deg, #ffe4e6 0%, #fda4af 100%)',
};

const CATEGORY_ACCENT: Record<string, string> = {
  pregnancy: '#7c3aed',
  intimacy: '#db2777',
  symptoms: '#0d9488',
  nutrition: '#d97706',
  baby: '#e11d48',
};

@Component({
  selector: 'app-article-detail',
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, LogoLoadingComponent, TranslatePipe],
  host: { class: 'ion-page' },
})
export class ArticleDetailComponent implements OnInit, OnDestroy {
  article: ArticleContent | null = null;
  isLoading = true;
  isFavorite = false;
  readProgress = 0;

  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly favoritesService = inject(FavoritesService);
  private readonly toastController = inject(ToastController);
  private readonly articleContent = inject(ArticleContentService);
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private langChangeSub?: Subscription;
  private routeParamsSub?: Subscription;
  private favoritesSub?: Subscription;
  private currentArticleId = '';

  get loadingMessage(): string {
    return this.t('article.loading');
  }

  ngOnInit() {
    this.favoritesSub = this.favoritesService.getFavorites().subscribe(() => {
      if (this.currentArticleId) {
        this.isFavorite = this.favoritesService.isFavoriteSync(this.currentArticleId);
        this.cdr.markForCheck();
      }
    });

    this.langChangeSub = this.languageService.currentLanguage$.subscribe(() => {
      if (this.currentArticleId) {
        this.applyArticle(this.currentArticleId);
      }
      this.cdr.markForCheck();
    });

    this.routeParamsSub = this.activatedRoute.params.subscribe((params) => {
      const articleId = params['id'] as string;
      this.currentArticleId = articleId;
      this.loadArticle(articleId);
    });
  }

  ngOnDestroy(): void {
    this.langChangeSub?.unsubscribe();
    this.routeParamsSub?.unsubscribe();
    this.favoritesSub?.unsubscribe();
  }

  loadArticle(articleId: string) {
    this.isLoading = true;
    this.readProgress = 0;
    this.applyArticle(articleId);
    this.isFavorite = this.favoritesService.isFavoriteSync(articleId);
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  private applyArticle(articleId: string): void {
    this.article = this.articleContent.getArticle(articleId);
  }

  toggleFavorite() {
    if (!this.article) return;

    const favoriteItem = {
      id: this.article.id,
      type: 'article' as const,
      title: this.article.title,
      description: this.article.summary,
      image: this.article.image,
      category: this.article.category,
      data: this.article,
    };

    this.favoritesService.toggleFavorite(favoriteItem);
    this.isFavorite = this.favoritesService.isFavoriteSync(this.article.id);
  }

  onContentScroll(event: Event): void {
    const ionContent = event.target as HTMLIonContentElement;
    void ionContent.getScrollElement().then((scrollEl) => {
      const max = scrollEl.scrollHeight - scrollEl.clientHeight;
      this.readProgress =
        max > 0 ? Math.min(100, Math.round((scrollEl.scrollTop / max) * 100)) : 0;
      this.cdr.markForCheck();
    });
  }

  getCategorySlug(): string {
    if (!this.article) {
      return 'pregnancy';
    }
    return ARTICLE_CATEGORY_BY_ID[this.article.id] ?? 'pregnancy';
  }

  getCategoryGradient(): string {
    return CATEGORY_GRADIENT[this.getCategorySlug()] ?? CATEGORY_GRADIENT['pregnancy'];
  }

  getCategoryAccent(): string {
    return CATEGORY_ACCENT[this.getCategorySlug()] ?? CATEGORY_ACCENT['pregnancy'];
  }

  formatPublishDate(iso: string): string {
    try {
      const raw = iso.includes('T') ? iso : `${iso}T12:00:00`;
      const lang = this.languageService.getCurrentLanguage();
      const locale =
        lang === 'fa' ? 'fa-IR' : lang === 'zh' ? 'zh-CN' : lang === 'ms' ? 'ms-MY' : 'en-US';
      return new Date(raw).toLocaleDateString(locale, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  }

  getRelatedPreview(relatedId: string): {
    title: string;
    image: string;
    category: string;
  } {
    const slug = ARTICLE_CATEGORY_BY_ID[relatedId] ?? 'pregnancy';
    return {
      title: this.articleContent.getRelatedTitle(relatedId),
      image: ARTICLE_IMAGE_BY_ID[relatedId] ?? 'assets/images/image1.png',
      category: this.t(`article.category.${slug}`),
    };
  }

  handleHeroImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img || img.dataset['fallbackApplied'] === 'true') {
      return;
    }
    img.dataset['fallbackApplied'] = 'true';
    img.src = this.getFallbackImage();
  }

  handleRelatedImageError(event: Event, relatedId: string): void {
    const img = event.target as HTMLImageElement;
    if (!img || img.dataset['fallbackApplied'] === 'true') {
      return;
    }
    img.dataset['fallbackApplied'] = 'true';
    img.src = 'assets/images/image1.png';
  }

  private getFallbackImage(): string {
    const slug = this.getCategorySlug();
    const fallbacks: Record<string, string> = {
      pregnancy: 'assets/images/image1.png',
      intimacy: 'assets/images/welcome2.png',
      symptoms: 'assets/images/bg-01.png',
      nutrition: 'assets/images/image1.png',
      baby: 'assets/images/welcome2.png',
    };
    return fallbacks[slug] ?? 'assets/images/bg-01.png';
  }

  async shareArticle(): Promise<void> {
    if (!this.article) {
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: this.article.title,
          text: this.article.summary,
          url: window.location.href,
        });
        return;
      } catch {
        /* user cancelled or share failed */
      }
    }

    await this.copyToClipboard();
  }

  private async copyToClipboard(): Promise<void> {
    if (!this.article) {
      return;
    }

    const shareText = `${this.article.title}\n\n${this.article.summary}\n\n${window.location.href}`;

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        const toast = await this.toastController.create({
          message: this.t('article.toast.linkCopied'),
          duration: 2200,
          position: 'bottom',
          color: 'success',
        });
        await toast.present();
        return;
      } catch {
        /* fall through */
      }
    }

    const toast = await this.toastController.create({
      message: this.t('article.toast.copyFailed'),
      duration: 3200,
      position: 'bottom',
      color: 'medium',
    });
    await toast.present();
  }

  goBack() {
    this.router.navigate(['/tabs/insights']);
  }

  openRelatedArticle(articleId: string) {
    this.router.navigate(['/article', articleId]);
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
