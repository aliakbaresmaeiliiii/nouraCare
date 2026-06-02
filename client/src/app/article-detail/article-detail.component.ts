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
import type { ArticleContent } from './article.types';

@Component({
  selector: 'app-article-detail',
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, LogoLoadingComponent, TranslatePipe],
})
export class ArticleDetailComponent implements OnInit, OnDestroy {
  article: ArticleContent | null = null;
  isLoading = true;
  isFavorite = false;

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
  private currentArticleId = '';

  /** Resolved on each change detection so loading copy follows the active language. */
  get loadingMessage(): string {
    return this.t('article.loading');
  }

  ngOnInit() {
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
  }

  loadArticle(articleId: string) {
    this.isLoading = true;
    setTimeout(() => {
      this.applyArticle(articleId);
      this.isLoading = false;
      if (this.article) {
        this.checkFavoriteStatus();
      }
      this.cdr.markForCheck();
    }, 300);
  }

  private applyArticle(articleId: string): void {
    this.article = this.articleContent.getArticle(articleId);
  }

  checkFavoriteStatus() {
    if (this.article) {
      this.favoritesService.isFavorite(this.article.id).subscribe((isFav) => {
        this.isFavorite = isFav;
        this.cdr.markForCheck();
      });
    }
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
    this.isFavorite = !this.isFavorite;
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

  relatedArticleTitle(relatedId: string): string {
    return this.articleContent.getRelatedTitle(relatedId);
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
