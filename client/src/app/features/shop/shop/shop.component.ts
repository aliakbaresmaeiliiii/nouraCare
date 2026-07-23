import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ActionSheetController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  bagOutline,
  cartOutline,
  chevronBack,
  chevronForwardOutline,
  funnelOutline,
  gridOutline,
  heartOutline,
  medkitOutline,
  nutritionOutline,
  shirtOutline,
  star,
  womanOutline,
  cubeOutline,
} from 'ionicons/icons';
import { LanguageService } from '@app/shared/services/language.service';
import { TranslationService } from '@app/shared/services/translation.service';
import { SHARED_STANDALONE_IMPORTS } from '@app/shared/shared-standalone';
import { SHOP_CATEGORIES, SHOP_PRODUCTS } from '@app/features/shop/shop/data/shop-catalog.data';
import {
  ShopCategoryId,
  ShopCategoryRow,
  ShopFilters,
  ShopProduct,
  ShopSortOption,
} from '@app/features/shop/shop/models/shop.models';
import { ShopCartService } from '@app/features/shop/shop/services/shop-cart.service';

@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cart = inject(ShopCartService);
  private readonly translation = inject(TranslationService);
  private readonly language = inject(LanguageService);
  private readonly actionSheet = inject(ActionSheetController);
  private readonly toast = inject(ToastController);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  categories = SHOP_CATEGORIES;
  readonly browseCategories = SHOP_CATEGORIES.filter((cat) => cat.id !== 'all');

  filters: ShopFilters = {
    category: 'all',
    search: '',
    sort: 'featured',
    inStockOnly: false,
    onSaleOnly: false,
  };

  categoryRows: ShopCategoryRow[] = [];
  showFilters = false;

  private readonly productBatchSize = 6;
  private readonly rowVisibleCounts = new Map<ShopCategoryId, number>();

  private readonly syncCartBadge = effect(() => {
    this.cart.itemCount();
    this.cdr.markForCheck();
  });

  ngOnInit(): void {
    addIcons({
      chevronBack,
      chevronForwardOutline,
      cartOutline,
      bagOutline,
      funnelOutline,
      gridOutline,
      womanOutline,
      shirtOutline,
      nutritionOutline,
      heartOutline,
      cubeOutline,
      medkitOutline,
      star,
    });

    this.applyFilters();

    this.language.currentLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  get cartCount(): number {
    return this.cart.itemCount();
  }

  get hasProducts(): boolean {
    return this.categoryRows.length > 0;
  }

  get productCount(): number {
    return this.categoryRows.reduce((sum, row) => sum + row.products.length, 0);
  }

  get isMultiRowBrowse(): boolean {
    return this.filters.category === 'all';
  }

  goBack(): void {
    void this.router.navigate(['/tabs/tools']);
  }

  openCart(): void {
    void this.router.navigate(['/shop/cart']);
  }

  openProduct(product: ShopProduct): void {
    void this.router.navigate(['/shop/product', product.id]);
  }

  setCategory(category: ShopCategoryId): void {
    this.filters = { ...this.filters, category };
    this.applyFilters();
  }

  focusCategory(categoryId: ShopCategoryId): void {
    this.setCategory(categoryId);
  }

  onSearch(event: Event): void {
    const value = (event as CustomEvent).detail?.value ?? '';
    this.filters = { ...this.filters, search: String(value).trim() };
    this.applyFilters();
  }

  toggleFiltersPanel(): void {
    this.showFilters = !this.showFilters;
    this.cdr.markForCheck();
  }

  toggleInStock(): void {
    this.filters = { ...this.filters, inStockOnly: !this.filters.inStockOnly };
    this.applyFilters();
  }

  toggleOnSale(): void {
    this.filters = { ...this.filters, onSaleOnly: !this.filters.onSaleOnly };
    this.applyFilters();
  }

  clearFilters(): void {
    this.filters = {
      category: 'all',
      search: '',
      sort: 'featured',
      inStockOnly: false,
      onSaleOnly: false,
    };
    this.showFilters = false;
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return (
      this.filters.category !== 'all' ||
      !!this.filters.search ||
      this.filters.sort !== 'featured' ||
      this.filters.inStockOnly ||
      this.filters.onSaleOnly
    );
  }

  async openSortSheet(): Promise<void> {
    const sheet = await this.actionSheet.create({
      header: this.t('shop.sortBy'),
      buttons: [
        { text: this.t('shop.sort.featured'), handler: () => this.setSort('featured') },
        { text: this.t('shop.sort.priceAsc'), handler: () => this.setSort('price-asc') },
        { text: this.t('shop.sort.priceDesc'), handler: () => this.setSort('price-desc') },
        { text: this.t('shop.sort.rating'), handler: () => this.setSort('rating') },
        { text: this.t('common.cancel'), role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  setSort(sort: ShopSortOption): void {
    this.filters = { ...this.filters, sort };
    this.applyFilters();
  }

  addToCart(product: ShopProduct, event: Event): void {
    event.stopPropagation();
    if (!product.inStock) {
      void this.showToast('shop.toast.outOfStock', 'warning');
      return;
    }
    this.cart.add(product.id);
    void this.showToast('shop.toast.added', 'success');
    this.cdr.markForCheck();
  }

  formatPrice(product: ShopProduct): string {
    if (this.language.getCurrentLanguage() === 'fa') {
      const irr = Math.round(product.price * 420_000);
      return `${irr.toLocaleString('fa-IR')} تومان`;
    }
    return `$${product.price.toFixed(2)}`;
  }

  formatOriginalPrice(product: ShopProduct): string | null {
    if (!product.originalPrice) return null;
    if (this.language.getCurrentLanguage() === 'fa') {
      const irr = Math.round(product.originalPrice * 420_000);
      return `${irr.toLocaleString('fa-IR')} تومان`;
    }
    return `$${product.originalPrice.toFixed(2)}`;
  }

  discountPercent(product: ShopProduct): number | null {
    if (!product.originalPrice || product.originalPrice <= product.price) return null;
    return Math.round((1 - product.price / product.originalPrice) * 100);
  }

  t(key: string): string {
    return this.translation.translate(key);
  }

  rowCountLabel(row: ShopCategoryRow): string {
    return this.translation.translateParams('shop.categoryProductCount', {
      count: row.products.length,
    });
  }

  resultsLabel(): string {
    return this.translation.translateParams('shop.resultsCount', {
      count: this.productCount,
    });
  }

  getRowVisibleProducts(row: ShopCategoryRow): ShopProduct[] {
    if (!this.isMultiRowBrowse) {
      return row.products;
    }

    const count = this.rowVisibleCounts.get(row.category.id) ?? this.productBatchSize;
    return row.products.slice(0, count);
  }

  rowHasMore(row: ShopCategoryRow): boolean {
    if (!this.isMultiRowBrowse) {
      return false;
    }
    const count = this.rowVisibleCounts.get(row.category.id) ?? this.productBatchSize;
    return count < row.products.length;
  }

  onRowScroll(categoryId: ShopCategoryId, event: Event): void {
    if (!this.isMultiRowBrowse) {
      return;
    }

    const row = this.categoryRows.find((entry) => entry.category.id === categoryId);
    if (!row || !this.rowHasMore(row)) {
      return;
    }

    const el = event.currentTarget as HTMLElement;
    const threshold = 72;
    const remaining = el.scrollWidth - el.clientWidth - Math.abs(el.scrollLeft);
    if (remaining > threshold) {
      return;
    }

    const current = this.rowVisibleCounts.get(categoryId) ?? this.productBatchSize;
    this.rowVisibleCounts.set(
      categoryId,
      Math.min(current + this.productBatchSize, row.products.length),
    );
    this.cdr.markForCheck();
  }

  private applyFilters(): void {
    let list = [...SHOP_PRODUCTS];

    if (this.filters.search) {
      const q = this.filters.search.toLowerCase();
      list = list.filter(
        (p) =>
          this.t(p.titleKey).toLowerCase().includes(q) ||
          this.t(p.descKey).toLowerCase().includes(q),
      );
    }
    if (this.filters.inStockOnly) {
      list = list.filter((p) => p.inStock);
    }
    if (this.filters.onSaleOnly) {
      list = list.filter((p) => p.originalPrice != null);
    }

    list = this.sortProducts(list);

    const grouped = new Map<Exclude<ShopCategoryId, 'all'>, ShopProduct[]>();
    for (const product of list) {
      const bucket = grouped.get(product.category) ?? [];
      bucket.push(product);
      grouped.set(product.category, bucket);
    }

    const visibleCategories = this.browseCategories.filter((cat) => {
      if (this.filters.category !== 'all' && cat.id !== this.filters.category) {
        return false;
      }
      return (grouped.get(cat.id as Exclude<ShopCategoryId, 'all'>)?.length ?? 0) > 0;
    });

    this.rowVisibleCounts.clear();
    this.categoryRows = visibleCategories.map((category) => ({
      category,
      products: grouped.get(category.id as Exclude<ShopCategoryId, 'all'>) ?? [],
    }));

    for (const row of this.categoryRows) {
      this.rowVisibleCounts.set(row.category.id, this.productBatchSize);
    }

    this.cdr.markForCheck();
  }

  private sortProducts(list: ShopProduct[]): ShopProduct[] {
    const sorted = [...list];
    switch (this.filters.sort) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      default:
        return sorted.sort((a, b) => b.reviewCount - a.reviewCount);
    }
  }

  private async showToast(
    key: string,
    color: 'success' | 'warning' = 'success',
  ): Promise<void> {
    const toast = await this.toast.create({
      message: this.t(key),
      duration: 2200,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
