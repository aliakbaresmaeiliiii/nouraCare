export type ShopCategoryId =
  | 'all'
  | 'maternity'
  | 'baby-clothing'
  | 'feeding'
  | 'care'
  | 'toys'
  | 'hospital';

export type ShopSortOption = 'featured' | 'price-asc' | 'price-desc' | 'rating';

export interface ShopCategory {
  id: ShopCategoryId;
  labelKey: string;
  icon: string;
}

export interface ShopProduct {
  id: string;
  titleKey: string;
  descKey: string;
  category: Exclude<ShopCategoryId, 'all'>;
  price: number;
  originalPrice?: number;
  currency: 'USD' | 'IRR';
  imageUrl: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  badgeKey?: string;
  tags: string[];
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface ShopFilters {
  category: ShopCategoryId;
  search: string;
  sort: ShopSortOption;
  inStockOnly: boolean;
  onSaleOnly: boolean;
}
