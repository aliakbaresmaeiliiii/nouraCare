import { Routes } from '@angular/router';
import { authGuard } from '@app/core/auth/guards/auth.guard';

export const SHOP_ROUTES: Routes = [
  {
    path: 'payment',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@app/features/shop/payment/payment-page/payment-page.component').then(
            (m) => m.PaymentPageComponent,
          ),
      },
      {
        path: 'result',
        loadComponent: () =>
          import(
            '@app/features/shop/payment/payment-result/payment-result.component'
          ).then((m) => m.PaymentResultComponent),
      },
    ],
  },
  {
    path: 'shop',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () =>
          import('@app/features/shop/shop/shop.component').then((m) => m.ShopComponent),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('@app/features/shop/shop/shop-cart/shop-cart.component').then(
            (m) => m.ShopCartComponent,
          ),
      },
      {
        path: 'product/:id',
        loadComponent: () =>
          import(
            '@app/features/shop/shop/shop-product-detail/shop-product-detail.component'
          ).then((m) => m.ShopProductDetailComponent),
      },
    ],
  },
];
