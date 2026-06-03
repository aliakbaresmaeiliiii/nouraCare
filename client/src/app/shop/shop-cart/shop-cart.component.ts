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
import { AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  addOutline,
  bagOutline,
  chevronBack,
  removeOutline,
  trashOutline,
} from 'ionicons/icons';
import { LanguageService } from '../../shared/services/language.service';
import { TranslationService } from '../../shared/services/translation.service';
import { SHARED_STANDALONE_IMPORTS } from '../../shared/shared-standalone';
import { ShopProduct } from '../models/shop.models';
import { ShopCartService } from '../services/shop-cart.service';
import { PaymentCheckoutService } from '../../payment/services/payment-checkout.service';

@Component({
  selector: 'app-shop-cart',
  templateUrl: './shop-cart.component.html',
  styleUrls: ['./shop-cart.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  host: { class: 'ion-page' },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopCartComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly cart = inject(ShopCartService);
  private readonly paymentCheckout = inject(PaymentCheckoutService);
  private readonly translation = inject(TranslationService);
  private readonly language = inject(LanguageService);
  private readonly toast = inject(ToastController);
  private readonly alert = inject(AlertController);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  items: { product: ShopProduct; quantity: number }[] = [];

  private readonly syncCartItems = effect(() => {
    this.cart.cartLines();
    this.items = this.cart.getLineItems();
    this.cdr.markForCheck();
  });

  ngOnInit(): void {
    addIcons({
      chevronBack,
      bagOutline,
      addOutline,
      removeOutline,
      trashOutline,
    });

    this.language.currentLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cdr.markForCheck());
  }

  get subtotalLabel(): string {
    return this.formatAmount(this.cart.subtotal());
  }

  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  goBack(): void {
    void this.router.navigate(['/shop']);
  }

  continueShopping(): void {
    void this.router.navigate(['/shop']);
  }

  changeQty(productId: string, delta: number): void {
    const current = this.cart.quantityOf(productId);
    this.cart.setQuantity(productId, current + delta);
  }

  removeItem(productId: string): void {
    this.cart.remove(productId);
  }

  async clearCart(): Promise<void> {
    const a = await this.alert.create({
      header: this.t('shop.clearCartTitle'),
      message: this.t('shop.clearCartMessage'),
      buttons: [
        { text: this.t('common.cancel'), role: 'cancel' },
        {
          text: this.t('common.delete'),
          role: 'destructive',
          handler: () => this.cart.clear(),
        },
      ],
    });
    await a.present();
  }

  async checkout(): Promise<void> {
    if (this.isEmpty) return;
    await this.paymentCheckout.startShopCheckout();
  }

  formatPrice(product: ShopProduct): string {
    return this.formatAmount(product.price);
  }

  lineTotal(product: ShopProduct, qty: number): string {
    return this.formatAmount(product.price * qty);
  }

  private formatAmount(amount: number): string {
    if (this.language.getCurrentLanguage() === 'fa') {
      return `${Math.round(amount * 420_000).toLocaleString('fa-IR')} تومان`;
    }
    return `$${amount.toFixed(2)}`;
  }

  private t(key: string): string {
    return this.translation.translate(key);
  }
}
