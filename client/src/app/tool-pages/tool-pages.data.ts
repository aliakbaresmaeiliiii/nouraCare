export interface ContentCard {
  id: string;
  titleKey: string;
  bodyKey: string;
  icon?: string;
  tagKey?: string;
}

export interface ChecklistItemDef {
  id: string;
  labelKey: string;
}

export interface RecipeDef {
  id: string;
  titleKey: string;
  descKey: string;
  timeKey: string;
  icon: string;
}

export interface LullabyDef {
  id: string;
  titleKey: string;
  durationKey: string;
  /** Soft ambient tone — replace with bundled assets in production */
  audioUrl: string;
}

export interface StoryDef {
  id: string;
  titleKey: string;
  bodyKey: string;
  durationKey: string;
}

export interface BabyNameDef {
  id: string;
  name: string;
  meaningKey: string;
  gender: 'girl' | 'boy' | 'neutral';
}

export interface GrowthQuizQuestion {
  id: string;
  questionKey: string;
  options: { id: string; labelKey: string; score: number }[];
}

export interface ShopProduct {
  id: string;
  titleKey: string;
  priceKey: string;
  icon: string;
}

export const CONTENT_PAGES: Record<string, ContentCard[]> = {
  'nutrition-facts': [
    { id: 'nf1', titleKey: 'toolPage.nf1.title', bodyKey: 'toolPage.nf1.body', icon: 'leaf-outline', tagKey: 'toolPage.tag.tip' },
    { id: 'nf2', titleKey: 'toolPage.nf2.title', bodyKey: 'toolPage.nf2.body', icon: 'water-outline', tagKey: 'toolPage.tag.important' },
    { id: 'nf3', titleKey: 'toolPage.nf3.title', bodyKey: 'toolPage.nf3.body', icon: 'fish-outline', tagKey: 'toolPage.tag.tip' },
    { id: 'nf4', titleKey: 'toolPage.nf4.title', bodyKey: 'toolPage.nf4.body', icon: 'nutrition-outline', tagKey: 'toolPage.tag.important' },
  ],
  'sleep-facts': [
    { id: 'sf1', titleKey: 'toolPage.sf1.title', bodyKey: 'toolPage.sf1.body', icon: 'moon-outline', tagKey: 'toolPage.tag.tip' },
    { id: 'sf2', titleKey: 'toolPage.sf2.title', bodyKey: 'toolPage.sf2.body', icon: 'bed-outline', tagKey: 'toolPage.tag.important' },
    { id: 'sf3', titleKey: 'toolPage.sf3.title', bodyKey: 'toolPage.sf3.body', icon: 'alarm-outline', tagKey: 'toolPage.tag.tip' },
  ],
  'pregnancy-skills': [
    { id: 'ps1', titleKey: 'toolPage.ps1.title', bodyKey: 'toolPage.ps1.body', icon: 'body-outline', tagKey: 'toolPage.tag.skill' },
    { id: 'ps2', titleKey: 'toolPage.ps2.title', bodyKey: 'toolPage.ps2.body', icon: 'heart-outline', tagKey: 'toolPage.tag.skill' },
    { id: 'ps3', titleKey: 'toolPage.ps3.title', bodyKey: 'toolPage.ps3.body', icon: 'walk-outline', tagKey: 'toolPage.tag.skill' },
  ],
  collections: [
    { id: 'col1', titleKey: 'toolPage.col1.title', bodyKey: 'toolPage.col1.body', icon: 'albums-outline', tagKey: 'toolPage.tag.collection' },
    { id: 'col2', titleKey: 'toolPage.col2.title', bodyKey: 'toolPage.col2.body', icon: 'bookmark-outline', tagKey: 'toolPage.tag.collection' },
  ],
  'educational-videos': [
    { id: 'ev1', titleKey: 'toolPage.ev1.title', bodyKey: 'toolPage.ev1.body', icon: 'videocam-outline', tagKey: 'toolPage.tag.video' },
    { id: 'ev2', titleKey: 'toolPage.ev2.title', bodyKey: 'toolPage.ev2.body', icon: 'play-circle-outline', tagKey: 'toolPage.tag.video' },
    { id: 'ev3', titleKey: 'toolPage.ev3.title', bodyKey: 'toolPage.ev3.body', icon: 'school-outline', tagKey: 'toolPage.tag.video' },
  ],
  'game-intro': [
    { id: 'gi1', titleKey: 'toolPage.gi1.title', bodyKey: 'toolPage.gi1.body', icon: 'game-controller-outline', tagKey: 'toolPage.tag.play' },
    { id: 'gi2', titleKey: 'toolPage.gi2.title', bodyKey: 'toolPage.gi2.body', icon: 'happy-outline', tagKey: 'toolPage.tag.play' },
  ],
  'toy-intro': [
    { id: 'ti1', titleKey: 'toolPage.ti1.title', bodyKey: 'toolPage.ti1.body', icon: 'cube-outline', tagKey: 'toolPage.tag.toy' },
    { id: 'ti2', titleKey: 'toolPage.ti2.title', bodyKey: 'toolPage.ti2.body', icon: 'color-palette-outline', tagKey: 'toolPage.tag.toy' },
  ],
  'whats-natural': [
    { id: 'wn1', titleKey: 'toolPage.wn1.title', bodyKey: 'toolPage.wn1.body', icon: 'leaf-outline', tagKey: 'toolPage.tag.safe' },
    { id: 'wn2', titleKey: 'toolPage.wn2.title', bodyKey: 'toolPage.wn2.body', icon: 'sunny-outline', tagKey: 'toolPage.tag.safe' },
    { id: 'wn3', titleKey: 'toolPage.wn3.title', bodyKey: 'toolPage.wn3.body', icon: 'fitness-outline', tagKey: 'toolPage.tag.safe' },
  ],
  'whats-dangerous': [
    { id: 'wd1', titleKey: 'toolPage.wd1.title', bodyKey: 'toolPage.wd1.body', icon: 'warning-outline', tagKey: 'toolPage.tag.avoid' },
    { id: 'wd2', titleKey: 'toolPage.wd2.title', bodyKey: 'toolPage.wd2.body', icon: 'close-circle-outline', tagKey: 'toolPage.tag.avoid' },
    { id: 'wd3', titleKey: 'toolPage.wd3.title', bodyKey: 'toolPage.wd3.body', icon: 'skull-outline', tagKey: 'toolPage.tag.avoid' },
  ],
  'pregnancy-care': [
    { id: 'pc1', titleKey: 'toolPage.pc1.title', bodyKey: 'toolPage.pc1.body', icon: 'medical-outline', tagKey: 'toolPage.tag.care' },
    { id: 'pc2', titleKey: 'toolPage.pc2.title', bodyKey: 'toolPage.pc2.body', icon: 'heart-outline', tagKey: 'toolPage.tag.care' },
    { id: 'pc3', titleKey: 'toolPage.pc3.title', bodyKey: 'toolPage.pc3.body', icon: 'calendar-outline', tagKey: 'toolPage.tag.care' },
  ],
  'allowed-foods': [
    { id: 'af1', titleKey: 'toolPage.af1.title', bodyKey: 'toolPage.af1.body', icon: 'checkmark-circle-outline', tagKey: 'toolPage.tag.allowed' },
    { id: 'af2', titleKey: 'toolPage.af2.title', bodyKey: 'toolPage.af2.body', icon: 'nutrition-outline', tagKey: 'toolPage.tag.allowed' },
    { id: 'af3', titleKey: 'toolPage.af3.title', bodyKey: 'toolPage.af3.body', icon: 'restaurant-outline', tagKey: 'toolPage.tag.allowed' },
  ],
};

export const CHECKLIST_PAGES: Record<string, ChecklistItemDef[]> = {
  layette: [
    { id: 'l1', labelKey: 'toolPage.layette.l1' },
    { id: 'l2', labelKey: 'toolPage.layette.l2' },
    { id: 'l3', labelKey: 'toolPage.layette.l3' },
    { id: 'l4', labelKey: 'toolPage.layette.l4' },
    { id: 'l5', labelKey: 'toolPage.layette.l5' },
    { id: 'l6', labelKey: 'toolPage.layette.l6' },
    { id: 'l7', labelKey: 'toolPage.layette.l7' },
    { id: 'l8', labelKey: 'toolPage.layette.l8' },
  ],
  'hospital-bag': [
    { id: 'h1', labelKey: 'toolPage.hospital.h1' },
    { id: 'h2', labelKey: 'toolPage.hospital.h2' },
    { id: 'h3', labelKey: 'toolPage.hospital.h3' },
    { id: 'h4', labelKey: 'toolPage.hospital.h4' },
    { id: 'h5', labelKey: 'toolPage.hospital.h5' },
    { id: 'h6', labelKey: 'toolPage.hospital.h6' },
    { id: 'h7', labelKey: 'toolPage.hospital.h7' },
    { id: 'h8', labelKey: 'toolPage.hospital.h8' },
  ],
  vaccines: [
    { id: 'v1', labelKey: 'toolPage.vaccines.v1' },
    { id: 'v2', labelKey: 'toolPage.vaccines.v2' },
    { id: 'v3', labelKey: 'toolPage.vaccines.v3' },
    { id: 'v4', labelKey: 'toolPage.vaccines.v4' },
    { id: 'v5', labelKey: 'toolPage.vaccines.v5' },
    { id: 'v6', labelKey: 'toolPage.vaccines.v6' },
  ],
};

export const RECIPES: RecipeDef[] = [
  { id: 'r1', titleKey: 'toolPage.recipe.r1.title', descKey: 'toolPage.recipe.r1.desc', timeKey: 'toolPage.recipe.r1.time', icon: 'egg-outline' },
  { id: 'r2', titleKey: 'toolPage.recipe.r2.title', descKey: 'toolPage.recipe.r2.desc', timeKey: 'toolPage.recipe.r2.time', icon: 'pizza-outline' },
  { id: 'r3', titleKey: 'toolPage.recipe.r3.title', descKey: 'toolPage.recipe.r3.desc', timeKey: 'toolPage.recipe.r3.time', icon: 'restaurant-outline' },
  { id: 'r4', titleKey: 'toolPage.recipe.r4.title', descKey: 'toolPage.recipe.r4.desc', timeKey: 'toolPage.recipe.r4.time', icon: 'leaf-outline' },
];

export const LULLABIES: LullabyDef[] = [
  { id: 'lu1', titleKey: 'toolPage.lullaby.lu1', durationKey: 'toolPage.lullaby.dur3', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749bd27.mp3' },
  { id: 'lu2', titleKey: 'toolPage.lullaby.lu2', durationKey: 'toolPage.lullaby.dur4', audioUrl: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_0528a984c6.mp3' },
  { id: 'lu3', titleKey: 'toolPage.lullaby.lu3', durationKey: 'toolPage.lullaby.dur5', audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' },
];

export const STORIES: StoryDef[] = [
  { id: 'st1', titleKey: 'toolPage.story.st1.title', bodyKey: 'toolPage.story.st1.body', durationKey: 'toolPage.story.dur3' },
  { id: 'st2', titleKey: 'toolPage.story.st2.title', bodyKey: 'toolPage.story.st2.body', durationKey: 'toolPage.story.dur5' },
  { id: 'st3', titleKey: 'toolPage.story.st3.title', bodyKey: 'toolPage.story.st3.body', durationKey: 'toolPage.story.dur4' },
];

export const BABY_NAMES: BabyNameDef[] = [
  { id: 'n1', name: 'نورا', meaningKey: 'toolPage.name.n1', gender: 'girl' },
  { id: 'n2', name: 'آرین', meaningKey: 'toolPage.name.n2', gender: 'boy' },
  { id: 'n3', name: 'سارا', meaningKey: 'toolPage.name.n3', gender: 'girl' },
  { id: 'n4', name: 'امیر', meaningKey: 'toolPage.name.n4', gender: 'boy' },
  { id: 'n5', name: 'یاس', meaningKey: 'toolPage.name.n5', gender: 'neutral' },
  { id: 'n6', name: 'رها', meaningKey: 'toolPage.name.n6', gender: 'girl' },
  { id: 'n7', name: 'کیان', meaningKey: 'toolPage.name.n7', gender: 'boy' },
  { id: 'n8', name: 'مهتاب', meaningKey: 'toolPage.name.n8', gender: 'girl' },
];

export const GROWTH_QUIZ: GrowthQuizQuestion[] = [
  {
    id: 'q1',
    questionKey: 'toolPage.quiz.q1',
    options: [
      { id: 'a', labelKey: 'toolPage.quiz.q1a', score: 1 },
      { id: 'b', labelKey: 'toolPage.quiz.q1b', score: 2 },
      { id: 'c', labelKey: 'toolPage.quiz.q1c', score: 3 },
    ],
  },
  {
    id: 'q2',
    questionKey: 'toolPage.quiz.q2',
    options: [
      { id: 'a', labelKey: 'toolPage.quiz.q2a', score: 1 },
      { id: 'b', labelKey: 'toolPage.quiz.q2b', score: 2 },
      { id: 'c', labelKey: 'toolPage.quiz.q2c', score: 3 },
    ],
  },
  {
    id: 'q3',
    questionKey: 'toolPage.quiz.q3',
    options: [
      { id: 'a', labelKey: 'toolPage.quiz.q3a', score: 1 },
      { id: 'b', labelKey: 'toolPage.quiz.q3b', score: 2 },
      { id: 'c', labelKey: 'toolPage.quiz.q3c', score: 3 },
    ],
  },
  {
    id: 'q4',
    questionKey: 'toolPage.quiz.q4',
    options: [
      { id: 'a', labelKey: 'toolPage.quiz.q4a', score: 1 },
      { id: 'b', labelKey: 'toolPage.quiz.q4b', score: 2 },
      { id: 'c', labelKey: 'toolPage.quiz.q4c', score: 3 },
    ],
  },
  {
    id: 'q5',
    questionKey: 'toolPage.quiz.q5',
    options: [
      { id: 'a', labelKey: 'toolPage.quiz.q5a', score: 1 },
      { id: 'b', labelKey: 'toolPage.quiz.q5b', score: 2 },
      { id: 'c', labelKey: 'toolPage.quiz.q5c', score: 3 },
    ],
  },
];

export const SHOP_PRODUCTS: ShopProduct[] = [
  { id: 'p1', titleKey: 'toolPage.shop.p1', priceKey: 'toolPage.shop.price1', icon: 'shirt-outline' },
  { id: 'p2', titleKey: 'toolPage.shop.p2', priceKey: 'toolPage.shop.price2', icon: 'heart-outline' },
  { id: 'p3', titleKey: 'toolPage.shop.p3', priceKey: 'toolPage.shop.price3', icon: 'cube-outline' },
  { id: 'p4', titleKey: 'toolPage.shop.p4', priceKey: 'toolPage.shop.price4', icon: 'medkit-outline' },
];

export const TRACKER_CONFIG: Record<string, { valueLabelKey: string; max: number; min: number }> = {
  'allergy-tracker': { valueLabelKey: 'toolPage.tracker.severity', max: 10, min: 1 },
  'appetite-tracker': { valueLabelKey: 'toolPage.tracker.appetite', max: 10, min: 1 },
};

export const MEMORY_EMOJIS = ['👶', '🤰', '💕', '📸', '🎉', '🌸', '💝', '🍼'];
