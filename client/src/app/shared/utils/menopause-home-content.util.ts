export type MenopauseStage = 'perimenopause' | 'menopause';

export type MenopauseSituationKey =
  | 'peri_no_period'
  | 'peri_recent'
  | 'peri_irregular'
  | 'peri_long_gap'
  | 'menopause';

export interface MenopauseGuideCard {
  id: string;
  ionIcon: string;
  accentHex: string;
  titleKey: string;
  bodyKey: string;
}

export interface MenopauseHomeContent {
  situationKey: MenopauseSituationKey;
  headlineKey: string;
  summaryKey: string;
  summaryParams?: Record<string, string | number>;
  timelinePhaseKey: string;
  timelineNoteKey: string;
  symptomChipKeys: string[];
  guideCards: MenopauseGuideCard[];
  dailyTipKeys: string[];
}

type TranslateFn = (key: string) => string;
type TranslateParamsFn = (
  key: string,
  params: Record<string, string | number>,
) => string;

export function resolveMenopauseSituationKey(
  stage: MenopauseStage,
  daysSinceLastPeriod: number | null,
): MenopauseSituationKey {
  if (stage === 'menopause') {
    return 'menopause';
  }
  if (daysSinceLastPeriod == null) {
    return 'peri_no_period';
  }
  if (daysSinceLastPeriod >= 60) {
    return 'peri_long_gap';
  }
  if (daysSinceLastPeriod >= 35) {
    return 'peri_irregular';
  }
  return 'peri_recent';
}

export function buildMenopauseHomeContent(
  stage: MenopauseStage,
  daysSinceLastPeriod: number | null,
): MenopauseHomeContent {
  const situationKey = resolveMenopauseSituationKey(stage, daysSinceLastPeriod);

  const headlineKey = `home.menopause.situation.${situationKey}.headline`;
  const summaryKey = `home.menopause.situation.${situationKey}.summary`;
  const summaryParams =
    daysSinceLastPeriod != null ? { days: daysSinceLastPeriod } : undefined;

  const timelinePhaseKey =
    stage === 'menopause'
      ? 'home.menopause.timeline.menopause.phase'
      : 'home.menopause.timeline.peri.phase';
  const timelineNoteKey =
    stage === 'menopause'
      ? 'home.menopause.timeline.menopause.note'
      : situationKey === 'peri_long_gap'
        ? 'home.menopause.timeline.peri.longGapNote'
        : 'home.menopause.timeline.peri.note';

  const symptomChipKeys =
    stage === 'menopause'
      ? [
          'home.menopause.symptom.hotFlashes',
          'home.menopause.symptom.sleep',
          'home.menopause.symptom.boneHealth',
          'home.menopause.symptom.mood',
        ]
      : [
          'home.menopause.symptom.irregularPeriods',
          'home.menopause.symptom.hotFlashes',
          'home.menopause.symptom.sleep',
          'home.menopause.symptom.brainFog',
        ];

  const guideCards: MenopauseGuideCard[] =
    stage === 'menopause'
      ? [
          {
            id: 'bone',
            ionIcon: 'fitness-outline',
            accentHex: '#6366f1',
            titleKey: 'home.menopause.guide.bone.title',
            bodyKey: 'home.menopause.guide.bone.body',
          },
          {
            id: 'heart',
            ionIcon: 'heart-outline',
            accentHex: '#ec4899',
            titleKey: 'home.menopause.guide.heart.title',
            bodyKey: 'home.menopause.guide.heart.body',
          },
          {
            id: 'sleep',
            ionIcon: 'moon-outline',
            accentHex: '#8b5cf6',
            titleKey: 'home.menopause.guide.sleep.title',
            bodyKey: 'home.menopause.guide.sleep.body',
          },
        ]
      : [
          {
            id: 'cycles',
            ionIcon: 'analytics-outline',
            accentHex: '#6366f1',
            titleKey: 'home.menopause.guide.cycles.title',
            bodyKey: 'home.menopause.guide.cycles.body',
          },
          {
            id: 'symptoms',
            ionIcon: 'thermometer-outline',
            accentHex: '#f59e0b',
            titleKey: 'home.menopause.guide.symptoms.title',
            bodyKey: 'home.menopause.guide.symptoms.body',
          },
          {
            id: 'relief',
            ionIcon: 'leaf-outline',
            accentHex: '#10b981',
            titleKey: 'home.menopause.guide.relief.title',
            bodyKey: 'home.menopause.guide.relief.body',
          },
        ];

  const dailyTipKeys = [
    `home.menopause.daily.${situationKey}.tip1`,
    `home.menopause.daily.${situationKey}.tip2`,
    `home.menopause.daily.${situationKey}.tip3`,
  ];

  return {
    situationKey,
    headlineKey,
    summaryKey,
    summaryParams,
    timelinePhaseKey,
    timelineNoteKey,
    symptomChipKeys,
    guideCards,
    dailyTipKeys,
  };
}

export function translateMenopauseText(
  key: string,
  tr: TranslateFn,
  trParams: TranslateParamsFn,
  params?: Record<string, string | number>,
): string {
  if (params && Object.keys(params).length) {
    return trParams(key, params);
  }
  return tr(key);
}
