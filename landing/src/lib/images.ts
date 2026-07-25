/** Local app screenshots from public/images/screen */
export const SCREEN_IMAGES = {
  hero: "/images/human/images.jpg",
  about: "/images/screen/IMG_9727.PNG",
  expertise: "/images/screen/IMG_9730.PNG",
  features: {
    cycle: "/images/screen/IMG_9736.PNG",
    symptoms: "/images/screen/IMG_9735.PNG",
    pregnancy: "/images/screen/IMG_9727.PNG",
    consultation: "/images/screen/IMG_9730.PNG",
  },
  extras: {
    tools: "/images/screen/IMG_9728.PNG",
    insights: "/images/screen/IMG_9729.PNG",
    community: "/images/screen/IMG_9726.PNG",
    forums: "/images/screen/IMG_9732.PNG",
  },
} as const;

/** @deprecated use SCREEN_IMAGES */
export const CDN_IMAGES = {
  hero: SCREEN_IMAGES.hero,
  about: SCREEN_IMAGES.about,
  expertise: SCREEN_IMAGES.expertise,
} as const;
