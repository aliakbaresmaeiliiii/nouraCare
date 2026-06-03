import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { Router } from '@angular/router';

import { Subject, takeUntil, firstValueFrom, catchError, of } from 'rxjs';

import { AlertController, ToastController } from '@ionic/angular';

import { FavoritesService, FavoriteItem, FavoriteStats } from '../shared/services/favorites.service';

import { TranslationService } from '../shared/services/translation.service';

import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

import { formatRecordedAtDate } from '../shared/utils/locale-date-format.util';

import { LanguageService } from '../shared/services/language.service';
import { ArticleContentService } from '../shared/services/article-content.service';
import {
  DEFAULT_SUBSCRIPTION_SUMMARY,
  SubscriptionService,
} from '../shared/services/subscription.service';



@Component({

  selector: 'app-my-favorites',

  templateUrl: './my-favorites.component.html',

  styleUrls: ['./my-favorites.component.scss'],

  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})

export class MyFavoritesComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();



  favorites: FavoriteItem[] = [];

  filteredFavorites: FavoriteItem[] = [];

  favoriteStats: FavoriteStats = {

    totalFavorites: 0,

    articleCount: 0,

    doctorCount: 0,

    toolCount: 0,

    tipCount: 0,

  };



  isLoading = false;

  searchTerm = '';

  selectedCategory = 'all';

  selectedSort = 'recent';

  showEmptyState = false;



  categories = [

    { value: 'all', labelKey: 'myFavorites.categoryAll', icon: 'apps' },

    { value: 'article', labelKey: 'myFavorites.categoryArticle', icon: 'document-text' },

    { value: 'doctor', labelKey: 'myFavorites.categoryDoctor', icon: 'medical' },

    { value: 'tool', labelKey: 'myFavorites.categoryTool', icon: 'construct' },

    { value: 'tip', labelKey: 'myFavorites.categoryTip', icon: 'bulb' },

  ];



  sortOptions = [

    { value: 'recent', labelKey: 'myFavorites.sortRecent' },

    { value: 'oldest', labelKey: 'myFavorites.sortOldest' },

    { value: 'alphabetical', labelKey: 'myFavorites.sortAlphabetical' },

    { value: 'type', labelKey: 'myFavorites.sortType' },

  ];



  private readonly favoritesService = inject(FavoritesService);

  private readonly alertController = inject(AlertController);

  private readonly toastController = inject(ToastController);

  private readonly translation = inject(TranslationService);

  private readonly languageService = inject(LanguageService);
  private readonly articleContent = inject(ArticleContentService);
  private readonly subscriptionService = inject(SubscriptionService);

  public readonly router = inject(Router);



  private readonly noResultsCategoryKeys: Record<string, string> = {

    article: 'myFavorites.noResultsArticles',

    doctor: 'myFavorites.noResultsDoctors',

    tool: 'myFavorites.noResultsTools',

    tip: 'myFavorites.noResultsTips',

  };



  private readonly typeLabelKeys: Record<FavoriteItem['type'], string> = {

    article: 'myFavorites.typeArticle',

    doctor: 'myFavorites.typeDoctor',

    tool: 'myFavorites.typeTool',

    tip: 'myFavorites.typeTip',

  };



  ngOnInit() {

    this.loadFavorites();

    this.loadStats();

  }



  ngOnDestroy() {

    this.destroy$.next();

    this.destroy$.complete();

  }



  loadFavorites() {

    this.isLoading = true;

    this.favoritesService

      .getFavorites()

      .pipe(takeUntil(this.destroy$))

      .subscribe({

        next: (favorites) => {

          this.favorites = favorites;

          this.applyFilters();

          this.showEmptyState = favorites.length === 0;

          this.isLoading = false;

        },

        error: (error) => {

          console.error('Error loading favorites:', error);

          this.showToast(this.t('myFavorites.loadFailed'), 'danger');

          this.isLoading = false;

        },

      });

  }



  loadStats() {

    this.favoritesService

      .getFavoriteStats()

      .pipe(takeUntil(this.destroy$))

      .subscribe((stats) => {

        this.favoriteStats = stats;

      });

  }



  applyFilters() {

    let filtered = [...this.favorites];



    if (this.searchTerm.trim()) {

      filtered = filtered.filter(

        (item) =>

          item.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||

          (item.description &&

            item.description.toLowerCase().includes(this.searchTerm.toLowerCase())),

      );

    }



    if (this.selectedCategory !== 'all') {

      filtered = filtered.filter((item) => item.type === this.selectedCategory);

    }



    switch (this.selectedSort) {

      case 'recent':

        filtered.sort(

          (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime(),

        );

        break;

      case 'oldest':

        filtered.sort(

          (a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime(),

        );

        break;

      case 'alphabetical':

        filtered.sort((a, b) => a.title.localeCompare(b.title));

        break;

      case 'type':

        filtered.sort((a, b) => a.type.localeCompare(b.type));

        break;

    }



    this.filteredFavorites = filtered;

  }



  onSearchChange(event: Event) {

    const customEvent = event as CustomEvent<{ value?: string }>;

    this.searchTerm = customEvent.detail?.value ?? '';

    this.applyFilters();

  }



  onCategoryChange(category: string) {

    this.selectedCategory = category;

    this.applyFilters();

  }



  onSortChange(event: Event) {

    const customEvent = event as CustomEvent<{ value?: string }>;

    this.selectedSort = customEvent.detail?.value ?? 'recent';

    this.applyFilters();

  }



  getNoResultsCategoryMessage(): string | null {
    const key = this.noResultsCategoryKeys[this.selectedCategory];
    return key ? this.t(key) : null;
  }

  getNoResultsSearchMessage(): string {
    return this.tParams('myFavorites.noResultsSearch', { searchTerm: this.searchTerm });
  }

  async removeFavorite(item: FavoriteItem, event?: Event) {

    if (event) {

      event.stopPropagation();

    }



    const alert = await this.alertController.create({

      header: this.t('myFavorites.removeHeader'),

      message: this.tParams('myFavorites.removeMessage', { title: item.title }),

      buttons: [

        { text: this.t('common.cancel'), role: 'cancel' },

        {

          text: this.t('myFavorites.remove'),

          role: 'destructive',

          handler: () => {

            this.favoritesService.removeFromFavorites(item.id);

            this.showToast(this.t('myFavorites.removedToast'), 'success');

          },

        },

      ],

    });



    await alert.present();

  }



  async clearAllFavorites() {

    const alert = await this.alertController.create({

      header: this.t('myFavorites.clearAllHeader'),

      message: this.t('myFavorites.clearAllMessage'),

      buttons: [

        { text: this.t('common.cancel'), role: 'cancel' },

        {

          text: this.t('myFavorites.clearAll'),

          role: 'destructive',

          handler: () => {

            this.favoritesService.clearAllFavorites();

            this.showToast(this.t('myFavorites.clearedToast'), 'success');

          },

        },

      ],

    });



    await alert.present();

  }



  async openFavoriteItem(item: FavoriteItem) {

    try {

      switch (item.type) {

        case 'article':

          if (this.articleContent.isPremiumArticle(item.id)) {
            const summary = await firstValueFrom(
              this.subscriptionService.getSummary().pipe(
                catchError(() => of(DEFAULT_SUBSCRIPTION_SUMMARY)),
              ),
            );
            if (!summary.hasPremiumAccess) {
              await this.router.navigate(['/nouracare-pro']);
              break;
            }
          }

          await this.router.navigate(['/article', item.id]);

          this.showToast(

            this.tParams('myFavorites.openArticle', { title: item.title }),

            'success',

          );

          break;



        case 'doctor':

          if (item.data?.id) {

            await this.router.navigate(['/doctor', item.data.id]);

            this.showToast(

              this.tParams('myFavorites.openDoctor', { title: item.title }),

              'success',

            );

          } else {

            await this.router.navigate(['/doctors']);

            this.showToast(this.t('myFavorites.openDoctorsList'), 'success');

          }

          break;



        case 'tool':

          await this.router.navigate(['/tabs/insights'], {

            queryParams: { openTool: item.id },

          });

          this.showToast(

            this.tParams('myFavorites.openTool', { title: item.title }),

            'success',

          );

          break;



        case 'tip':

          await this.router.navigate(['/tabs/home']);

          this.showToast(

            this.tParams('myFavorites.openTip', { title: item.title }),

            'success',

          );

          break;



        default:

          await this.router.navigate(['/tabs/home']);

          this.showToast(this.t('myFavorites.openingContent'), 'success');

          break;

      }

    } catch (error) {

      console.error('Error opening favorite item:', error);

      this.showToast(this.t('myFavorites.openFailed'), 'danger');

    }

  }



  getTypeIcon(type: FavoriteItem['type']): string {

    const icons = {

      article: 'document-text',

      doctor: 'medical',

      tool: 'construct',

      tip: 'bulb',

    };

    return icons[type] || 'heart';

  }



  getTypeColor(type: FavoriteItem['type']): string {

    const colors = {

      article: '#3b82f6',

      doctor: '#10b981',

      tool: '#ffd700',

      tip: '#8b5cf6',

    };

    return colors[type] || '#6b7280';

  }



  getTypeLabel(type: FavoriteItem['type']): string {

    const key = this.typeLabelKeys[type];

    return key ? this.t(key) : type;

  }



  formatDate(date: Date): string {

    const now = new Date();

    const diffInHours = Math.floor(

      (now.getTime() - date.getTime()) / (1000 * 60 * 60),

    );



    if (diffInHours < 1) {

      return this.t('myFavorites.dateJustNow');

    }

    if (diffInHours < 24) {

      return this.tParams('myFavorites.dateHoursAgo', { hours: diffInHours });

    }

    if (diffInHours < 168) {

      const days = Math.floor(diffInHours / 24);

      return this.tParams('myFavorites.dateDaysAgo', { days });

    }



    return formatRecordedAtDate(date, this.languageService.getCurrentLanguage());

  }



  async showToast(

    message: string,

    color: 'success' | 'danger' | 'warning' = 'success',

  ) {

    const toast = await this.toastController.create({

      message,

      duration: 3000,

      color,

      position: 'bottom',

    });

    await toast.present();

  }



  goBack() {

    this.router.navigate(['/tabs/home']);

  }



  private t(key: string): string {

    return this.translation.translate(key);

  }



  private tParams(key: string, params: Record<string, string | number>): string {

    return this.translation.translateParams(key, params);

  }

}


