import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  albumsOutline,
  analyticsOutline,
  bagOutline,
  barChartOutline,
  bedOutline,
  bookOutline,
  briefcaseOutline,
  calendarOutline,
  checkmarkCircleOutline,
  constructOutline,
  cubeOutline,
  flameOutline,
  flowerOutline,
  footballOutline,
  gameControllerOutline,
  heartOutline,
  helpCircleOutline,
  imagesOutline,
  leafOutline,
  medicalOutline,
  moonOutline,
  musicalNotesOutline,
  newspaperOutline,
  nutritionOutline,
  restaurantOutline,
  schoolOutline,
  searchOutline,
  shieldCheckmarkOutline,
  shirtOutline,
  statsChartOutline,
  textOutline,
  trendingUpOutline,
  videocamOutline,
  warningOutline,
  waterOutline,
  chevronDownOutline,
  chevronForwardOutline,
  chevronUpOutline,
} from 'ionicons/icons';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LanguageService } from '@app/shared/services/language.service';
import { TranslationService } from '@app/shared/services/translation.service';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import {
  TOOL_CATEGORIES,
  ToolCategory,
  ToolMenuItem,
} from '@app/features/content/tool-pages/tool-pages.config';

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly translation = inject(TranslationService);
  private readonly languageService = inject(LanguageService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  categories: ToolCategory[] = TOOL_CATEGORIES;
  searchQuery = '';
  expandedCategory: string | null = 'articles';

  ngOnInit(): void {
    addIcons({
      constructOutline,
      searchOutline,
      newspaperOutline,
      schoolOutline,
      nutritionOutline,
      moonOutline,
      flowerOutline,
      albumsOutline,
      videocamOutline,
      gameControllerOutline,
      cubeOutline,
      waterOutline,
      medicalOutline,
      calendarOutline,
      bagOutline,
      shirtOutline,
      briefcaseOutline,
      shieldCheckmarkOutline,
      leafOutline,
      warningOutline,
      heartOutline,
      analyticsOutline,
      footballOutline,
      imagesOutline,
      textOutline,
      restaurantOutline,
      flameOutline,
      alertCircleOutline,
      barChartOutline,
      checkmarkCircleOutline,
      bedOutline,
      musicalNotesOutline,
      bookOutline,
      trendingUpOutline,
      statsChartOutline,
      helpCircleOutline,
      chevronDownOutline,
      chevronUpOutline,
      chevronForwardOutline,
    });

    this.languageService.currentLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  toggleCategory(id: string): void {
    this.expandedCategory = this.expandedCategory === id ? null : id;
    this.cdr.markForCheck();
  }

  isCategoryExpanded(id: string): boolean {
    if (this.searchQuery.trim()) return true;
    return this.expandedCategory === id;
  }

  filteredItems(category: ToolCategory): ToolMenuItem[] {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) return category.items;
    return category.items.filter(
      (item) =>
        this.t(item.titleKey).toLowerCase().includes(q) ||
        this.t(item.descKey).toLowerCase().includes(q),
    );
  }

  visibleCategories(): ToolCategory[] {
    const q = this.searchQuery.trim();
    if (!q) return this.categories;
    return this.categories
      .map((cat) => ({ ...cat, items: this.filteredItems(cat) }))
      .filter((cat) => cat.items.length > 0);
  }

  openTool(item: ToolMenuItem): void {
    if (item.externalRoute) {
      void this.router.navigateByUrl(item.externalRoute);
      return;
    }
    if (item.route) {
      void this.router.navigate(['/tool-pages', item.route]);
    }
  }

  t(key: string): string {
    return this.translation.translate(key);
  }
}
