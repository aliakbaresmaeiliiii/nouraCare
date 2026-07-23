import { Injectable, inject } from '@angular/core';
import type { ArticleContent } from '@app/features/content/article-detail/article.types';
import { TranslationService } from '@app/shared/services/translation.service';
import { LanguageService } from '@app/shared/services/language.service';
import { ARTICLE_DATABASE_EN } from '@app/shared/content/article-database.en.content';
import { ARTICLE_DATABASE_ZH } from '@app/shared/content/article-database.zh.content';
import { ARTICLE_DATABASE_MS } from '@app/shared/content/article-database.ms.content';
import { ARTICLE_DATABASE_FA } from '@app/shared/content/article-database.fa.content';
import {
  ARTICLE_CATEGORY_BY_ID,
  ARTICLE_IMAGE_BY_ID,
  ARTICLE_PUBLISH_DATE_BY_ID,
  ARTICLE_READ_MINUTES_BY_ID,
  VALID_ARTICLE_IDS,
  isPremiumArticleId,
} from '@app/shared/content/article-translations.content';

const DATABASE_BY_LANG: Record<string, Record<string, ArticleContent>> = {
  en: ARTICLE_DATABASE_EN,
  zh: ARTICLE_DATABASE_ZH,
  ms: ARTICLE_DATABASE_MS,
  fa: ARTICLE_DATABASE_FA,
};

@Injectable({ providedIn: 'root' })
export class ArticleContentService {
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);

  getArticle(articleId: string): ArticleContent | null {
    if (!VALID_ARTICLE_IDS.has(articleId)) {
      return null;
    }

    const lang = this.languageService.getCurrentLanguage();
    const db = DATABASE_BY_LANG[lang] ?? DATABASE_BY_LANG['en'];
    const full = db[articleId];
    if (full) {
      return full;
    }

    return this.buildStubArticle(articleId);
  }

  getRelatedTitle(relatedId: string): string {
    return this.translation.translate(`insights.article.${relatedId}`);
  }

  isPremiumArticle(articleId: string): boolean {
    return isPremiumArticleId(articleId);
  }

  private buildStubArticle(articleId: string): ArticleContent {
    const categorySlug = ARTICLE_CATEGORY_BY_ID[articleId] ?? 'pregnancy';
    const summaryKey = `article.summary.${articleId}`;
    const summary = this.translation.translate(summaryKey);
    const minutes = ARTICLE_READ_MINUTES_BY_ID[articleId] ?? 5;

    return {
      id: articleId,
      title: this.translation.translate(`insights.article.${articleId}`),
      category: this.translation.translate(`article.category.${categorySlug}`),
      author: this.translation.translate('article.authorDefault'),
      publishDate: ARTICLE_PUBLISH_DATE_BY_ID[articleId] ?? '2024-01-01',
      readTime: this.translation.translateParams('article.readTime', { minutes }),
      image: ARTICLE_IMAGE_BY_ID[articleId] ?? ARTICLE_IMAGE_BY_ID['1'],
      summary: summary !== summaryKey ? summary : this.translation.translate('article.stub.intro'),
      content: [
        { type: 'paragraph', content: this.translation.translate('article.stub.intro') },
        { type: 'paragraph', content: this.translation.translate('article.stub.body1') },
        { type: 'paragraph', content: this.translation.translate('article.stub.body2') },
      ],
      tags: [
        this.translation.translate('article.tag.pregnancy'),
        this.translation.translate('article.tag.health'),
        this.translation.translate('article.tag.wellness'),
      ],
      relatedArticles: [],
    };
  }
}
