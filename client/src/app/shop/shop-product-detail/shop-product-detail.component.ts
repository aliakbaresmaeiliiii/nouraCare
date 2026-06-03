import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cartOutline, chevronBack, removeOutline, addOutline, star } from 'ionicons/icons';
import { LanguageService } from '../../shared/services/language.service';
import { TranslationService } from '../../shared/services/translation.service';
import { SHARED_STANDALONE_IMPORTS } from '../../shared/shared-standalone';
import { getProductById } from '../data/shop-catalog.data';
import { ShopProduct } from '../models/shop.models';
import { ShopCartService } from '../services/shop-cart.service';

@Component({
  selector: 'app-shop-product-detail',
  templateUrl: './shop-product-detail.component.html',
  styleUrls: ['./shop-product-detail.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cart = inject(ShopCartService);
  private readonly translation = inject(TranslationService);
  private readonly language = inject(LanguageService);
  private readonly toast = inject(ToastController);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  product?: ShopProduct;
  quantity = 1;

  ngOnInit(): void {
    addIcons({ chevronBack, cartOutline, star, addOutline, removeOutline });

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = params.get('id') ?? '';
      this.product = getProductById(id);
      this.quantity = Math.max(1, this.cart.quantityOf(id) || 1);
      this.cdr.markForCheck();
    });

    this.language.currentLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  goBack(): void {
    void this.router.navigate(['/shop']);
  }

  openCart(): void {
    void this.router.navigate(['/shop/cart']);
  }

  changeQty(delta: number): void {
    this.quantity = Math.max(1, this.quantity + delta);
    this.cdr.markForCheck();
  }

  addToCart(): void {
    if (!this.product?.inStock) {
      void this.showToast('shop.toast.outOfStock', 'warning');
      return;
    }
    this.cart.add(this.product.id, this.quantity);
    void this.showToast('shop.toast.added', 'success');
  }

  buyNow(): void {
    this.addToCart();
    void this.router.navigate(['/shop/cart']);
  }

  formatPrice(product: ShopProduct): string {
    if (this.language.getCurrentLanguage() === 'fa') {
      return `${Math.round(product.price * 420_000).toLocaleString('fa-IR')} تومان`;
    }
    return `$${product.price.toFixed(2)}`;
  }

  formatOriginalPrice(product: ShopProduct): string | null {
    if (!product.originalPrice) return null;
    if (this.language.getCurrentLanguage() === 'fa') {
      return `${Math.round(product.originalPrice * 420_000).toLocaleString('fa-IR')} تومان`;
    }
    return `$${product.originalPrice.toFixed(2)}`;
  }

  private async showToast(key: string, color: 'success' | 'warning'): Promise<void> {
    const t = await this.toast.create({
      message: this.translation.translate(key),
      duration: 2200,
      color,
      position: 'bottom',
    });
    await t.present();
  }
}
