/** Brand illustrations in public/images/human */
const IMG = {
  heroAvatar: "/images/human/hero-avatar.png",
  heroCalm: "/images/human/hero-calm.png",
  heroCommunity: "/images/human/hero-community.png",
  about: "/images/human/about.png",
  expertise: "/images/human/expertise.png",
  cycle: "/images/human/feature-cycle.png",
  symptoms: "/images/human/feature-symptoms.png",
  pregnancy: "/images/human/feature-pregnancy.png",
  consultation: "/images/human/feature-consultation.png",
} as const;

/** Auto-rotating slides for the hero blob */
export const HERO_SLIDES = [
  IMG.heroAvatar,
  IMG.heroCalm,
  IMG.heroCommunity,
  IMG.cycle,
] as const;

export const SCREEN_IMAGES = {
  hero: IMG.heroAvatar,
  about: IMG.about,
  expertise: IMG.expertise,
  features: {
    cycle: IMG.cycle,
    symptoms: IMG.symptoms,
    pregnancy: IMG.pregnancy,
    consultation: IMG.consultation,
  },
  extras: {
    tools: IMG.symptoms,
    insights: IMG.cycle,
    community: IMG.heroCommunity,
    forums: IMG.consultation,
  },
} as const;

/** @deprecated use SCREEN_IMAGES */
export const CDN_IMAGES = {
  hero: SCREEN_IMAGES.hero,
  about: SCREEN_IMAGES.about,
  expertise: SCREEN_IMAGES.expertise,
} as const;
