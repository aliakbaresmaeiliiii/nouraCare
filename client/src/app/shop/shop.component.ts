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
import { LanguageService } from '../shared/services/language.service';
import { TranslationService } from '../shared/services/translation.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { SHOP_CATEGORIES, SHOP_PRODUCTS } from './data/shop-catalog.data';
import {
  ShopCategoryId,
  ShopFilters,
  ShopProduct,
  ShopSortOption,
} from './models/shop.models';
import { ShopCartService } from './services/shop-cart.service';

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
  filters: ShopFilters = {
    category: 'all',
    search: '',
    sort: 'featured',
    inStockOnly: false,
    onSaleOnly: false,
  };

  filteredProducts: ShopProduct[] = [];
  visibleProducts: ShopProduct[] = [];
  showFilters = false;
  loadingMoreProducts = false;
  hasMoreProducts = false;

  private allFilteredProducts: ShopProduct[] = [];
  private readonly productBatchSize = 6;

  private readonly syncCartBadge = effect(() => {
    this.cart.itemCount();
    this.cdr.markForCheck();
  });

  ngOnInit(): void {
    addIcons({
      chevronBack,
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
    return this.allFilteredProducts.length > 0;
  }

  get productCount(): number {
    return this.allFilteredProducts.length;
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

  resultsLabel(): string {
    if (this.hasMoreProducts) {
      return this.translation.translateParams('shop.resultsCountPartial', {
        shown: this.visibleProducts.length,
        total: this.allFilteredProducts.length,
      });
    }
    return this.translation.translateParams('shop.resultsCount', {
      count: this.allFilteredProducts.length,
    });
  }

  onProductsScroll(event: Event): void {
    const el = event.currentTarget as HTMLElement;
    if (!el || !this.hasMoreProducts || this.loadingMoreProducts) {
      return;
    }

    const threshold = 72;
    const remaining = el.scrollWidth - el.clientWidth - Math.abs(el.scrollLeft);
    if (remaining <= threshold) {
      this.loadMoreProducts();
    }
  }

  private loadMoreProducts(): void {
    if (!this.hasMoreProducts || this.loadingMoreProducts) {
      return;
    }

    this.loadingMoreProducts = true;
    const nextCount = Math.min(
      this.visibleProducts.length + this.productBatchSize,
      this.allFilteredProducts.length,
    );
    this.visibleProducts = this.allFilteredProducts.slice(0, nextCount);
    this.hasMoreProducts = nextCount < this.allFilteredProducts.length;
    this.loadingMoreProducts = false;
    this.cdr.markForCheck();
  }

  private applyFilters(): void {
    let list = [...SHOP_PRODUCTS];

    if (this.filters.category !== 'all') {
      list = list.filter((p) => p.category === this.filters.category);
    }
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

    switch (this.filters.sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      default:
        list.sort((a, b) => b.reviewCount - a.reviewCount);
    }

    this.allFilteredProducts = list;
    this.filteredProducts = list;
    this.resetVisibleProducts();
    this.cdr.markForCheck();
  }

  private resetVisibleProducts(): void {
    const initialCount = Math.min(this.productBatchSize, this.allFilteredProducts.length);
    this.visibleProducts = this.allFilteredProducts.slice(0, initialCount);
    this.hasMoreProducts = initialCount < this.allFilteredProducts.length;
  }

  private async showToast(
    key: string,
    color: 'success' | 'warning' = 'success',
  ): Promise<void> {
    const t = await this.toast.create({
      message: this.t(key),
      duration: 2200,
      color,
      position: 'bottom',
    });
    await t.present();
  }
}
