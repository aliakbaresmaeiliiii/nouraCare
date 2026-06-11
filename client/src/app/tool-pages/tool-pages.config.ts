export type ToolPageType =
  | 'content'
  | 'checklist'
  | 'tracker'
  | 'kick-counter'
  | 'pregnancy-chart'
  | 'lullaby'
  | 'stories'
  | 'memory-album'
  | 'baby-names'
  | 'recipes'
  | 'growth-chart'
  | 'growth-quiz'
  | 'cord-blood';

export type ToolCategoryId =
  | 'articles'
  | 'utilities'
  | 'nutrition'
  | 'sleep'
  | 'growth';

export interface ToolMenuItem {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  /** Internal route under `/tool-pages/` or external app route */
  route?: string;
  externalRoute?: string;
  pageType?: ToolPageType;
  color?: string;
}

export interface ToolCategory {
  id: ToolCategoryId;
  titleKey: string;
  subtitleKey: string;
  icon: string;
  items: ToolMenuItem[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    id: 'articles',
    titleKey: 'toolsMenu.cat.articles',
    subtitleKey: 'toolsMenu.cat.articlesSub',
    icon: 'newspaper-outline',
    items: [
      {
        id: 'dore-school',
        icon: 'school-outline',
        titleKey: 'toolsMenu.doreSchool',
        descKey: 'toolsMenu.doreSchoolDesc',
        externalRoute: '/tabs/school',
        color: '#6366f1',
      },
      {
        id: 'nutrition-facts',
        icon: 'nutrition-outline',
        titleKey: 'toolsMenu.nutritionFacts',
        descKey: 'toolsMenu.nutritionFactsDesc',
        route: 'nutrition-facts',
        pageType: 'content',
        color: '#10b981',
      },
      {
        id: 'sleep-facts',
        icon: 'moon-outline',
        titleKey: 'toolsMenu.sleepFacts',
        descKey: 'toolsMenu.sleepFactsDesc',
        route: 'sleep-facts',
        pageType: 'content',
        color: '#8b5cf6',
      },
      {
        id: 'pregnancy-skills',
        icon: 'flower-outline',
        titleKey: 'toolsMenu.pregnancySkills',
        descKey: 'toolsMenu.pregnancySkillsDesc',
        route: 'pregnancy-skills',
        pageType: 'content',
        color: '#ec4899',
      },
      {
        id: 'collections',
        icon: 'albums-outline',
        titleKey: 'toolsMenu.collections',
        descKey: 'toolsMenu.collectionsDesc',
        route: 'collections',
        pageType: 'content',
        color: '#f59e0b',
      },
      {
        id: 'educational-videos',
        icon: 'videocam-outline',
        titleKey: 'toolsMenu.educationalVideos',
        descKey: 'toolsMenu.educationalVideosDesc',
        route: 'educational-videos',
        pageType: 'content',
        color: '#ef4444',
      },
      {
        id: 'game-intro',
        icon: 'game-controller-outline',
        titleKey: 'toolsMenu.gameIntro',
        descKey: 'toolsMenu.gameIntroDesc',
        route: 'game-intro',
        pageType: 'content',
        color: '#06b6d4',
      },
      {
        id: 'toy-intro',
        icon: 'cube-outline',
        titleKey: 'toolsMenu.toyIntro',
        descKey: 'toolsMenu.toyIntroDesc',
        route: 'toy-intro',
        pageType: 'content',
        color: '#84cc16',
      },
    ],
  },
  {
    id: 'utilities',
    titleKey: 'toolsMenu.cat.utilities',
    subtitleKey: 'toolsMenu.cat.utilitiesSub',
    icon: 'construct-outline',
    items: [
      {
        id: 'cord-blood',
        icon: 'water-outline',
        titleKey: 'toolsMenu.cordBlood',
        descKey: 'toolsMenu.cordBloodDesc',
        route: 'cord-blood',
        pageType: 'cord-blood',
        color: '#dc2626',
      },
      {
        id: 'doctor-consult',
        icon: 'medical-outline',
        titleKey: 'toolsMenu.doctorConsult',
        descKey: 'toolsMenu.doctorConsultDesc',
        externalRoute: '/doctors',
        color: '#2563eb',
      },
      {
        id: 'period-calendar',
        icon: 'calendar-outline',
        titleKey: 'toolsMenu.periodCalendar',
        descKey: 'toolsMenu.periodCalendarDesc',
        externalRoute: '/cycle-calendar',
        color: '#7c3aed',
      },
      {
        id: 'shop',
        icon: 'bag-outline',
        titleKey: 'toolsMenu.shop',
        descKey: 'toolsMenu.shopDesc',
        externalRoute: '/shop',
        color: '#d97706',
      },
      {
        id: 'layette',
        icon: 'shirt-outline',
        titleKey: 'toolsMenu.layette',
        descKey: 'toolsMenu.layetteDesc',
        route: 'layette',
        pageType: 'checklist',
        color: '#db2777',
      },
      {
        id: 'hospital-bag',
        icon: 'briefcase-outline',
        titleKey: 'toolsMenu.hospitalBag',
        descKey: 'toolsMenu.hospitalBagDesc',
        route: 'hospital-bag',
        pageType: 'checklist',
        color: '#0891b2',
      },
      {
        id: 'vaccines',
        icon: 'shield-checkmark-outline',
        titleKey: 'toolsMenu.vaccines',
        descKey: 'toolsMenu.vaccinesDesc',
        route: 'vaccines',
        pageType: 'checklist',
        color: '#059669',
      },
      {
        id: 'whats-natural',
        icon: 'leaf-outline',
        titleKey: 'toolsMenu.whatsNatural',
        descKey: 'toolsMenu.whatsNaturalDesc',
        route: 'whats-natural',
        pageType: 'content',
        color: '#16a34a',
      },
      {
        id: 'whats-dangerous',
        icon: 'warning-outline',
        titleKey: 'toolsMenu.whatsDangerous',
        descKey: 'toolsMenu.whatsDangerousDesc',
        route: 'whats-dangerous',
        pageType: 'content',
        color: '#ea580c',
      },
      {
        id: 'pregnancy-care',
        icon: 'heart-outline',
        titleKey: 'toolsMenu.pregnancyCare',
        descKey: 'toolsMenu.pregnancyCareDesc',
        route: 'pregnancy-care',
        pageType: 'content',
        color: '#e11d48',
      },
      {
        id: 'pregnancy-chart',
        icon: 'analytics-outline',
        titleKey: 'toolsMenu.pregnancyChart',
        descKey: 'toolsMenu.pregnancyChartDesc',
        route: 'pregnancy-chart',
        pageType: 'pregnancy-chart',
        color: '#9333ea',
      },
      {
        id: 'kick-counter',
        icon: 'football-outline',
        titleKey: 'toolsMenu.kickCounter',
        descKey: 'toolsMenu.kickCounterDesc',
        route: 'kick-counter',
        pageType: 'kick-counter',
        color: '#4f46e5',
      },
      {
        id: 'memory-album',
        icon: 'images-outline',
        titleKey: 'toolsMenu.memoryAlbum',
        descKey: 'toolsMenu.memoryAlbumDesc',
        route: 'memory-album',
        pageType: 'memory-album',
        color: '#c026d3',
      },
      {
        id: 'baby-names',
        icon: 'text-outline',
        titleKey: 'toolsMenu.babyNames',
        descKey: 'toolsMenu.babyNamesDesc',
        route: 'baby-names',
        pageType: 'baby-names',
        color: '#0d9488',
      },
    ],
  },
  {
    id: 'nutrition',
    titleKey: 'toolsMenu.cat.nutrition',
    subtitleKey: 'toolsMenu.cat.nutritionSub',
    icon: 'restaurant-outline',
    items: [
      {
        id: 'recipes',
        icon: 'flame-outline',
        titleKey: 'toolsMenu.recipes',
        descKey: 'toolsMenu.recipesDesc',
        route: 'recipes',
        pageType: 'recipes',
        color: '#f97316',
      },
      {
        id: 'allergy-tracker',
        icon: 'alert-circle-outline',
        titleKey: 'toolsMenu.allergyTracker',
        descKey: 'toolsMenu.allergyTrackerDesc',
        route: 'allergy-tracker',
        pageType: 'tracker',
        color: '#ef4444',
      },
      {
        id: 'appetite-tracker',
        icon: 'bar-chart-outline',
        titleKey: 'toolsMenu.appetiteTracker',
        descKey: 'toolsMenu.appetiteTrackerDesc',
        route: 'appetite-tracker',
        pageType: 'tracker',
        color: '#eab308',
      },
      {
        id: 'allowed-foods',
        icon: 'checkmark-circle-outline',
        titleKey: 'toolsMenu.allowedFoods',
        descKey: 'toolsMenu.allowedFoodsDesc',
        route: 'allowed-foods',
        pageType: 'content',
        color: '#22c55e',
      },
    ],
  },
  {
    id: 'sleep',
    titleKey: 'toolsMenu.cat.sleep',
    subtitleKey: 'toolsMenu.cat.sleepSub',
    icon: 'bed-outline',
    items: [
      {
        id: 'lullabies',
        icon: 'musical-notes-outline',
        titleKey: 'toolsMenu.lullabies',
        descKey: 'toolsMenu.lullabiesDesc',
        route: 'lullabies',
        pageType: 'lullaby',
        color: '#6366f1',
      },
      {
        id: 'stories',
        icon: 'book-outline',
        titleKey: 'toolsMenu.stories',
        descKey: 'toolsMenu.storiesDesc',
        route: 'stories',
        pageType: 'stories',
        color: '#a855f7',
      },
    ],
  },
  {
    id: 'growth',
    titleKey: 'toolsMenu.cat.growth',
    subtitleKey: 'toolsMenu.cat.growthSub',
    icon: 'trending-up-outline',
    items: [
      {
        id: 'growth-chart',
        icon: 'stats-chart-outline',
        titleKey: 'toolsMenu.growthChart',
        descKey: 'toolsMenu.growthChartDesc',
        route: 'growth-chart',
        pageType: 'growth-chart',
        color: '#0284c7',
      },
      {
        id: 'growth-quiz',
        icon: 'help-circle-outline',
        titleKey: 'toolsMenu.growthQuiz',
        descKey: 'toolsMenu.growthQuizDesc',
        route: 'growth-quiz',
        pageType: 'growth-quiz',
        color: '#7c3aed',
      },
    ],
  },
];

export function getAllToolMenuItems(): ToolMenuItem[] {
  return TOOL_CATEGORIES.reduce<ToolMenuItem[]>((acc, c) => acc.concat(c.items), []);
}

export function getToolItemByRoute(route: string): ToolMenuItem | undefined {
  return getAllToolMenuItems().find((i) => i.route === route);
}

export function getToolPageRoutes(): { path: string; pageId: string }[] {
  return getAllToolMenuItems()
    .filter((i) => i.route && i.pageType)
    .map((i) => ({ path: i.route!, pageId: i.id }));
}
