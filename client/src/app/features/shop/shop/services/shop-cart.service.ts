import { Injectable, computed, signal } from '@angular/core';
import { getProductById } from '@app/features/shop/shop/data/shop-catalog.data';
import { CartLine, ShopProduct } from '@app/features/shop/shop/models/shop.models';

const STORAGE_KEY = 'dore_shop_cart';

@Injectable({ providedIn: 'root' })
export class ShopCartService {
  private readonly lines = signal<CartLine[]>(this.readStorage());

  readonly cartLines = this.lines.asReadonly();

  readonly itemCount = computed(() =>
    this.lines().reduce((sum, l) => sum + l.quantity, 0),
  );

  readonly subtotal = computed(() =>
    this.lines().reduce((sum, line) => {
      const product = getProductById(line.productId);
      return sum + (product ? product.price * line.quantity : 0);
    }, 0),
  );

  getProduct(id: string): ShopProduct | undefined {
    return getProductById(id);
  }

  getLineItems(): { product: ShopProduct; quantity: number }[] {
    return this.lines()
      .map((line) => {
        const product = getProductById(line.productId);
        return product ? { product, quantity: line.quantity } : null;
      })
      .filter((x): x is { product: ShopProduct; quantity: number } => x !== null);
  }

  quantityOf(productId: string): number {
    return this.lines().find((l) => l.productId === productId)?.quantity ?? 0;
  }

  add(productId: string, qty = 1): void {
    const product = getProductById(productId);
    if (!product?.inStock) return;

    const next = [...this.lines()];
    const existing = next.find((l) => l.productId === productId);
    if (existing) {
      existing.quantity += qty;
    } else {
      next.push({ productId, quantity: qty });
    }
    this.persist(next);
  }

  setQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.remove(productId);
      return;
    }
    const next = this.lines().map((l) =>
      l.productId === productId ? { ...l, quantity } : l,
    );
    this.persist(next);
  }

  remove(productId: string): void {
    this.persist(this.lines().filter((l) => l.productId !== productId));
  }

  clear(): void {
    this.persist([]);
  }

  private persist(lines: CartLine[]): void {
    this.lines.set(lines);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }

  private readStorage(): CartLine[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as CartLine[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
}
