import { Injectable, inject } from '@angular/core';
import { TranslationService } from './translation.service';

/** Minimal shape needed to resolve a forum category label. */
export interface ForumCategoryLike {
  id?: string;
  slug?: string;
  name?: string;
  description?: string;
}

/**
 * Maps forum category ids, slugs, and English API names to localized labels.
 * Unknown categories fall back to the raw API name/description.
 */
@Injectable({ providedIn: 'root' })
export class ForumCategoryMapperService {
  private readonly translation = inject(TranslationService);

  /** Canonical slug -> Ionicons outline icon. */
  private readonly iconBySlug: Readonly<Record<string, string>> = {
    'pregnancy-journey': 'map-outline',
    'first-trimester': 'leaf-outline',
    'second-trimester': 'flower-outline',
    'third-trimester': 'flag-outline',
    'newborn-care': 'body-outline',
    'infant-development': 'trending-up-outline',
    'toddler-parenting': 'walk-outline',
    'nutrition-diet': 'restaurant-outline',
    'mental-health': 'pulse-outline',
    'fitness-exercise': 'barbell-outline',
    'baby-gear-products': 'bag-outline',
    'breastfeeding-formula': 'water-outline',
    'sleep-solutions': 'moon-outline',
    'relationships-family': 'home-outline',
    'work-career-balance': 'briefcase-outline',
    'community-support': 'people-outline',
    'general-discussion': 'chatbubbles-outline',
    'pregnancy-fertility': 'heart-circle-outline',
    'health-wellness': 'fitness-outline',
    parenting: 'people-circle-outline',
    'medical-questions': 'medical-outline',
    'support-groups': 'heart-half-outline',
    'trying-to-conceive': 'search-outline',
    'pregnancy-tests': 'flask-outline',
    ovulation: 'calendar-outline',
    pregnancy: 'female-outline',
    parenthood: 'heart-outline',
    postpartum: 'bandage-outline',
    nutrition: 'nutrition-outline',
    exercise: 'barbell-outline',
    relationships: 'heart-half-outline',
    'new-parents': 'sparkles-outline',
    'product-reviews': 'star-outline',
    'birth-stories': 'book-outline',
    'ask-the-community': 'help-circle-outline',
  };

  /** Normalized id, slug, or display name -> canonical slug. */
  private readonly slugAliases: Readonly<Record<string, string>> = {
    'pregnancy journey': 'pregnancy-journey',
    'first trimester': 'first-trimester',
    '1st trimester': 'first-trimester',
    'second trimester': 'second-trimester',
    '2nd trimester': 'second-trimester',
    'third trimester': 'third-trimester',
    '3rd trimester': 'third-trimester',
    'newborn care': 'newborn-care',
    'infant development': 'infant-development',
    'toddler parenting': 'toddler-parenting',
    'nutrition & diet': 'nutrition-diet',
    'nutrition and diet': 'nutrition-diet',
    'mental health': 'mental-health',
    'fitness & exercise': 'fitness-exercise',
    'fitness and exercise': 'fitness-exercise',
    'baby gear & products': 'baby-gear-products',
    'baby gear and products': 'baby-gear-products',
    'breastfeeding & formula': 'breastfeeding-formula',
    'breastfeeding and formula': 'breastfeeding-formula',
    'sleep solutions': 'sleep-solutions',
    'relationships & family': 'relationships-family',
    'relationships and family': 'relationships-family',
    'work & career balance': 'work-career-balance',
    'work and career balance': 'work-career-balance',
    'community support': 'community-support',
    'general discussion': 'general-discussion',
    'pregnancy & fertility': 'pregnancy-fertility',
    'pregnancy and fertility': 'pregnancy-fertility',
    'health & wellness': 'health-wellness',
    'health and wellness': 'health-wellness',
    parenting: 'parenting',
    'medical questions': 'medical-questions',
    'support groups': 'support-groups',
    'trying to conceive': 'trying-to-conceive',
    'pregnancy tests': 'pregnancy-tests',
    ovulation: 'ovulation',
    pregnancy: 'pregnancy',
    parenthood: 'parenthood',
    postpartum: 'postpartum',
    nutrition: 'nutrition',
    exercise: 'exercise',
    relationships: 'relationships',
    'new parents': 'new-parents',
    'product reviews': 'product-reviews',
    'birth stories': 'birth-stories',
    'ask the community': 'ask-the-community',
  };

  resolveSlug(input: ForumCategoryLike | string | null | undefined): string | null {
    if (input == null) return null;

    if (typeof input === 'string') {
      return this.resolveFromString(input);
    }

    if (input.slug) {
      const fromSlug = this.resolveFromString(input.slug);
      if (fromSlug) return fromSlug;
    }

    if (input.id) {
      const fromId = this.resolveFromString(input.id);
      if (fromId) return fromId;
    }

    if (input.name) {
      return this.resolveFromString(input.name);
    }

    return null;
  }

  translateName(input: ForumCategoryLike | string | null | undefined): string {
    const rawName = this.rawName(input);
    const slug = this.resolveSlug(input);
    if (slug) {
      const key = `forums.category.${slug}.name`;
      const translated = this.translation.translate(key);
      if (translated !== key) {
        return translated;
      }
    }
    return rawName || this.translation.translate('forums.generalDiscussion');
  }

  translateDescription(input: ForumCategoryLike | string | null | undefined): string {
    const rawDescription =
      typeof input === 'object' && input != null ? input.description?.trim() ?? '' : '';
    const slug = this.resolveSlug(input);
    if (slug) {
      const key = `forums.category.${slug}.description`;
      const translated = this.translation.translate(key);
      if (translated !== key) {
        return translated;
      }
    }
    return rawDescription;
  }

  getIcon(input: ForumCategoryLike | string | null | undefined): string {
    const slug = this.resolveSlug(input);
    if (slug && this.iconBySlug[slug]) {
      return this.iconBySlug[slug];
    }
    return 'help-circle-outline';
  }

  private resolveFromString(value: string): string | null {
    const normalized = this.normalizeKey(value);
    if (!normalized) return null;

    if (this.iconBySlug[normalized]) {
      return normalized;
    }

    if (this.slugAliases[normalized]) {
      return this.slugAliases[normalized];
    }

    return null;
  }

  private rawName(input: ForumCategoryLike | string | null | undefined): string {
    if (input == null) return '';
    if (typeof input === 'string') return input.trim();
    return input.name?.trim() ?? '';
  }

  private normalizeKey(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }
}
