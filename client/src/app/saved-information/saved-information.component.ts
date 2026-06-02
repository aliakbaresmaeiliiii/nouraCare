import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  bookmarkOutline,
  bulbOutline,
  calendarOutline,
  closeOutline,
  documentOutline,
  documentTextOutline,
  gridOutline,
  libraryOutline,
  personOutline,
  playCircleOutline,
  refreshOutline,
  searchOutline,
  timeOutline,
} from 'ionicons/icons';
import type { RefresherCustomEvent } from '@ionic/core';
import {
  AlertController,
  IonSearchbar,
  ToastController,
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { LanguageService } from '../shared/services/language.service';
import { TranslationService } from '../shared/services/translation.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { formatRecordedAtDate } from '../shared/utils/locale-date-format.util';

interface SavedItem {
  id: number;
  /** When set, in-app reader opens this article id (see `article-detail` sample database). */
  articleRouteId?: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  savedAt: string;
  type: 'article' | 'tip' | 'resource' | 'video';
  readTime?: number;
  author?: string;
}

@Component({
  selector: 'app-saved-information',
  templateUrl: './saved-information.component.html',
  styleUrls: ['./saved-information.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  host: { class: 'ion-page' },
})
export class SavedInformationComponent implements OnInit, OnDestroy {
  @ViewChild('savedSearch', { read: IonSearchbar })
  private savedSearch?: IonSearchbar;

  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);

  private languageSub?: Subscription;

  savedItems: SavedItem[] = [];
  isLoading = false;
  errorMessage = '';
  selectedCategory = 'all';
  searchQuery = '';

  readonly categories = [
    { value: 'all', labelKey: 'savedInformation.categoryAll', icon: 'grid-outline' },
    {
      value: 'article',
      labelKey: 'savedInformation.categoryArticle',
      icon: 'document-text-outline',
    },
    { value: 'tip', labelKey: 'savedInformation.categoryTip', icon: 'bulb-outline' },
    {
      value: 'resource',
      labelKey: 'savedInformation.categoryResource',
      icon: 'library-outline',
    },
    { value: 'video', labelKey: 'savedInformation.categoryVideo', icon: 'play-circle-outline' },
  ];

  constructor() {
    addIcons({
      alertCircleOutline,
      bookmarkOutline,
      bulbOutline,
      calendarOutline,
      closeOutline,
      documentOutline,
      documentTextOutline,
      gridOutline,
      libraryOutline,
      personOutline,
      playCircleOutline,
      refreshOutline,
      searchOutline,
      timeOutline,
    });
  }

  ngOnInit(): void {
    this.languageSub = this.languageService.currentLanguage$.subscribe(() => {
      this.cdr.markForCheck();
    });
    void this.loadSavedItems();
  }

  ngOnDestroy(): void {
    this.languageSub?.unsubscribe();
  }

  async loadSavedItems(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await new Promise((r) => setTimeout(r, 450));
      this.savedItems = [
        {
          id: 1,
          articleRouteId: '1',
          title: 'Understanding Your Menstrual Cycle',
          description:
            'A guide to tracking and understanding your cycle phases and patterns.',
          category: 'article',
          imageUrl: 'assets/images/bg-01.png',
          savedAt: '2024-01-15T10:30:00Z',
          type: 'article',
          readTime: 5,
          author: 'Dr. Sarah Johnson',
        },
        {
          id: 2,
          articleRouteId: '10',
          title: 'Natural Remedies for Period Pain',
          description:
            'Home care ideas and gentle approaches many people use for cramps.',
          category: 'tip',
          imageUrl: 'assets/images/bg-01.png',
          savedAt: '2024-01-14T14:20:00Z',
          type: 'tip',
          readTime: 3,
          author: 'Health Expert',
        },
        {
          id: 3,
          articleRouteId: '11',
          title: 'Pregnancy Nutrition Guide',
          description:
            'Nutrients and meal ideas that support you through pregnancy.',
          category: 'resource',
          imageUrl: 'assets/images/bg-01.png',
          savedAt: '2024-01-13T09:15:00Z',
          type: 'resource',
          readTime: 8,
          author: 'Nutrition Specialist',
        },
        {
          id: 4,
          articleRouteId: '10',
          title: "Yoga for Women's Health",
          description:
            'Gentle poses often used to support comfort and mobility.',
          category: 'video',
          imageUrl: 'assets/images/bg-01.png',
          savedAt: '2024-01-12T16:45:00Z',
          type: 'video',
          readTime: 15,
          author: 'Yoga Instructor',
        },
      ];
    } catch {
      this.errorMessage = this.t('savedInformation.loadFailed');
    } finally {
      this.isLoading = false;
    }
  }

  onRefresh(event: RefresherCustomEvent): void {
    void this.loadSavedItems().finally(() => event.detail.complete());
  }

  onSearchChange(event: CustomEvent<{ value?: string | null }>): void {
    this.searchQuery = event.detail?.value ?? '';
  }

  async focusSearch(): Promise<void> {
    await this.savedSearch?.setFocus();
  }

  async confirmRemoveSavedItem(item: SavedItem, ev: Event): Promise<void> {
    ev.stopPropagation();
    const alert = await this.alertController.create({
      header: this.t('savedInformation.removeHeader'),
      message: this.tParams('savedInformation.removeMessage', { title: item.title }),
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('savedInformation.remove'),
          role: 'destructive',
          handler: () => {
            this.savedItems = this.savedItems.filter((i) => i.id !== item.id);
            void this.showToast(this.t('savedInformation.removedToast'));
          },
        },
      ],
    });
    await alert.present();
  }

  async openItem(item: SavedItem): Promise<void> {
    const articleId = item.articleRouteId ?? String(item.id);
    const ok = await this.router.navigate(['/article', articleId]);
    if (!ok) {
      await this.showToast(this.t('savedInformation.openFailed'));
    }
  }

  get filteredItems(): SavedItem[] {
    let items = this.savedItems;

    if (this.selectedCategory !== 'all') {
      items = items.filter((item) => item.category === this.selectedCategory);
    }

    const q = this.searchQuery.trim().toLowerCase();
    if (q) {
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.author?.toLowerCase().includes(q),
      );
    }

    return items;
  }

  getCategoryIcon(category: string): string {
    const cat = this.categories.find((c) => c.value === category);
    return cat?.icon ?? 'document-outline';
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) {
        return this.t('savedInformation.unknownDate');
      }
      return formatRecordedAtDate(date, this.languageService.getCurrentLanguage());
    } catch {
      return this.t('savedInformation.unknownDate');
    }
  }

  minReadLabel(minutes: number): string {
    return this.tParams('savedInformation.minRead', { minutes });
  }

  goBrowse(): void {
    void this.router.navigate(['/forums']);
  }

  onImageError(event: Event): void {
    const target = event.target as HTMLImageElement | null;
    if (target) {
      target.src = 'assets/images/bg-01.png';
    }
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }

  private tParams(key: string, vars: Record<string, string | number>): string {
    return this.translation.translateParams(key, vars);
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2200,
      position: 'bottom',
    });
    await toast.present();
  }
}
