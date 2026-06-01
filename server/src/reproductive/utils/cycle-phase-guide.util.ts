import { calendarDaysBetweenUtc } from './pregnancy-metrics.util';
import { utcMidnightFromDate } from './cycle-prediction.util';

export type CyclePhaseGuideAction =
  | 'insights'
  | 'fertility'
  | 'symptoms'
  | 'calendar'
  | 'period';

export interface CyclePhaseGuideCard {
  id: string;
  ionIcon: string;
  accentHex: string;
  title: string;
  body: string;
  action?: CyclePhaseGuideAction;
}

export interface CyclePhaseGuideContext {
  cycleDay: number;
  periodDay: number | null;
  cycleLength: number;
  daysToNextPeriod: number | null;
  daysToOvulation: number | null;
  avgBleed: number;
  confidence: number;
  hasPrePeriodPattern: boolean;
  hasOvulationPattern: boolean;
}

export interface CyclePhaseGuidePayload {
  phase: 'none' | 'period' | 'follicular' | 'fertile' | 'luteal';
  headline: string;
  subtitle: string;
  cards: CyclePhaseGuideCard[];
  context: CyclePhaseGuideContext;
}

export interface CyclePhaseGuideInput {
  cycleDay: number | null;
  avgBleed: number;
  cycleLength: number;
  nextPeriodIso: string | null;
  ovulationIso: string | null;
  fertileWindow: { start: string; end: string } | null;
  prePeriodPattern: boolean;
  ovulationPattern: boolean;
  gradualChangeDetected: boolean;
  confidence: number;
  today?: Date;
}

function daysFromTodayToIso(iso: string | null, today: Date): number | null {
  if (!iso) {
    return null;
  }
  const target = utcMidnightFromDate(new Date(`${iso}T00:00:00.000Z`));
  const t = utcMidnightFromDate(today);
  return calendarDaysBetweenUtc(t, target);
}

function resolvePhase(
  cycleDay: number,
  avgBleed: number,
  cycleLength: number,
  ovulationIso: string | null,
  fertileWindow: { start: string; end: string } | null,
  today: Date,
): 'period' | 'follicular' | 'fertile' | 'luteal' {
  const bleed = Math.max(2, Math.min(10, Math.round(avgBleed)));
  const len = Math.max(21, Math.min(45, Math.round(cycleLength)));
  if (cycleDay <= bleed) {
    return 'period';
  }
  const t = utcMidnightFromDate(today);
  if (fertileWindow) {
    const start = utcMidnightFromDate(new Date(`${fertileWindow.start}T00:00:00.000Z`));
    const end = utcMidnightFromDate(new Date(`${fertileWindow.end}T00:00:00.000Z`));
    if (t.getTime() >= start.getTime() && t.getTime() <= end.getTime()) {
      return 'fertile';
    }
  }
  if (ovulationIso) {
    const ov = utcMidnightFromDate(new Date(`${ovulationIso}T00:00:00.000Z`));
    const daysToOv = calendarDaysBetweenUtc(t, ov);
    if (daysToOv >= -1 && daysToOv <= 5) {
      return 'fertile';
    }
    if (cycleDay < len - 14) {
      return 'follicular';
    }
  } else if (cycleDay <= 14) {
    return 'follicular';
  }
  return 'luteal';
}

function ovulationPhrase(daysToOvulation: number | null): string {
  if (daysToOvulation == null) {
    return 'Ovulation timing will appear after more logs';
  }
  if (daysToOvulation === 0) {
    return 'Ovulation is likely today';
  }
  if (daysToOvulation > 0) {
    return `Ovulation in about ${daysToOvulation} day${daysToOvulation === 1 ? '' : 's'}`;
  }
  const ago = Math.abs(daysToOvulation);
  return `Ovulation was about ${ago} day${ago === 1 ? '' : 's'} ago`;
}

function buildPeriodGuide(
  periodDay: number,
  avgBleed: number,
  ctx: CyclePhaseGuideContext,
  prePeriodPattern: boolean,
): Pick<CyclePhaseGuidePayload, 'headline' | 'subtitle' | 'cards'> {
  if (periodDay === 1) {
    return {
      headline: 'Day 1 of your period',
      subtitle:
        'A new cycle starts today. Rest, hydration, and warmth can make the first day easier.',
      cards: [
        {
          id: 'period-day1-comfort',
          ionIcon: 'flame-outline',
          accentHex: '#e11d48',
          title: 'Go gently today',
          body: 'Light stretching, a warm shower, or a heating pad may ease early cramps.',
          action: 'symptoms',
        },
        {
          id: 'period-day1-hydration',
          ionIcon: 'water-outline',
          accentHex: '#0284c7',
          title: 'Hydrate steadily',
          body: 'Sips through the day often feel better than large amounts at once.',
          action: 'symptoms',
        },
        {
          id: 'period-day1-log',
          ionIcon: 'create-outline',
          accentHex: '#9333ea',
          title: 'Confirm your start date',
          body: 'Accurate day 1 helps predictions for ovulation and your next period.',
          action: 'period',
        },
      ],
    };
  }

  const headline =
    periodDay === avgBleed
      ? `Day ${periodDay} — often the last heavy day`
      : `Period day ${periodDay} of ~${avgBleed}`;

  const subtitle =
    periodDay <= 2
      ? 'Flow is usually heaviest now. Iron-rich meals and rest support recovery.'
      : 'Your body is shedding the lining. Keep logging how you feel day by day.';

  const cards: CyclePhaseGuideCard[] = [
    {
      id: 'period-comfort',
      ionIcon: 'flame-outline',
      accentHex: '#e11d48',
      title: 'Ease cramps naturally',
      body: 'Warmth, hydration, and gentle movement often help on period days.',
      action: 'symptoms',
    },
    {
      id: 'period-nutrition',
      ionIcon: 'nutrition-outline',
      accentHex: '#0d9488',
      title: 'Replenish iron',
      body: 'Leafy greens, lentils, and lean protein support recovery after bleeding.',
      action: 'insights',
    },
    {
      id: 'period-patterns',
      ionIcon: 'analytics-outline',
      accentHex: '#9333ea',
      title: prePeriodPattern ? 'Your pre-period pattern' : 'Spot your patterns',
      body: prePeriodPattern
        ? 'You often log similar symptoms before your period — we factor that into predictions.'
        : 'Log symptoms each month to see what repeats for you.',
      action: 'calendar',
    },
  ];

  return { headline, subtitle, cards };
}

export function buildCyclePhaseGuide(
  input: CyclePhaseGuideInput,
): CyclePhaseGuidePayload {
  const today = input.today ?? new Date();
  const cycleLength = Math.max(21, Math.min(45, Math.round(input.cycleLength || 28)));
  const avgBleed = Math.max(2, Math.min(10, Math.round(input.avgBleed || 5)));

  if (input.cycleDay == null || input.cycleDay < 1) {
    return {
      phase: 'none',
      headline: 'Begin your cycle story',
      subtitle: 'Log your last period once — predictions and daily tips unlock after that.',
      cards: [
        {
          id: 'none-log',
          ionIcon: 'calendar-outline',
          accentHex: '#db2777',
          title: 'Log your last period',
          body: 'One start date powers your ring, fertile window, and these daily cards.',
          action: 'period',
        },
        {
          id: 'none-reads',
          ionIcon: 'book-outline',
          accentHex: '#0d9488',
          title: 'Expert-backed reads',
          body: 'Nutrition, fertility, and body signs — curated for your journey.',
          action: 'insights',
        },
        {
          id: 'none-symptoms',
          ionIcon: 'happy-outline',
          accentHex: '#7c3aed',
          title: 'Track how you feel',
          body: 'Small daily logs reveal patterns over time.',
          action: 'symptoms',
        },
      ],
      context: {
        cycleDay: 0,
        periodDay: null,
        cycleLength,
        daysToNextPeriod: null,
        daysToOvulation: null,
        avgBleed,
        confidence: input.confidence,
        hasPrePeriodPattern: input.prePeriodPattern,
        hasOvulationPattern: input.ovulationPattern,
      },
    };
  }

  const cycleDay = Math.max(1, Math.round(input.cycleDay));
  const periodDay = cycleDay <= avgBleed ? cycleDay : null;
  const daysToNextPeriod = daysFromTodayToIso(input.nextPeriodIso, today);
  const daysToOvulation = daysFromTodayToIso(input.ovulationIso, today);
  const phase = resolvePhase(
    cycleDay,
    avgBleed,
    cycleLength,
    input.ovulationIso,
    input.fertileWindow,
    today,
  );

  const context: CyclePhaseGuideContext = {
    cycleDay,
    periodDay,
    cycleLength,
    daysToNextPeriod,
    daysToOvulation,
    avgBleed,
    confidence: input.confidence,
    hasPrePeriodPattern: input.prePeriodPattern,
    hasOvulationPattern: input.ovulationPattern,
  };

  if (phase === 'period' && periodDay != null) {
    const periodGuide = buildPeriodGuide(
      periodDay,
      avgBleed,
      context,
      input.prePeriodPattern,
    );
    return { phase, ...periodGuide, context };
  }

  if (phase === 'follicular') {
    const ovPhrase = ovulationPhrase(daysToOvulation);
    return {
      phase,
      headline: 'Energy is rising',
      subtitle: `${ovPhrase}. A good time for movement and steady routines.`,
      cards: [
        {
          id: 'follicular-move',
          ionIcon: 'walk-outline',
          accentHex: '#0d9488',
          title: 'Move your way',
          body: `Cycle day ${cycleDay} of ${cycleLength} — moderate exercise often feels best now.`,
          action: 'symptoms',
        },
        {
          id: 'follicular-fuel',
          ionIcon: 'restaurant-outline',
          accentHex: '#2563eb',
          title: 'Fuel consistently',
          body: 'Balanced meals keep energy steady as estrogen rises.',
          action: 'insights',
        },
        {
          id: 'follicular-plan',
          ionIcon: 'calendar-outline',
          accentHex: '#db2777',
          title: 'See the month ahead',
          body:
            daysToNextPeriod != null
              ? `Next period in about ${daysToNextPeriod} days — plan around your calendar.`
              : 'Open your cycle calendar to plan around upcoming phases.',
          action: 'calendar',
        },
      ],
      context,
    };
  }

  if (phase === 'fertile') {
    const ovPhrase = ovulationPhrase(daysToOvulation);
    return {
      phase,
      headline: 'Your fertile window',
      subtitle: input.ovulationPattern
        ? `${ovPhrase}. Your logged ovulation signs helped refine this timing.`
        : `${ovPhrase}. These are your highest-chance days this cycle.`,
      cards: [
        {
          id: 'fertile-peak',
          ionIcon: 'flower-outline',
          accentHex: '#7c3aed',
          title: 'Peak fertility days',
          body:
            daysToOvulation === 0
              ? 'Today is likely your best day for conception if you are trying.'
              : 'You are inside your fertile window — timing matters most now.',
          action: 'fertility',
        },
        {
          id: 'fertile-calc',
          ionIcon: 'heart-outline',
          accentHex: '#db2777',
          title: 'Fertility calculator',
          body: 'See your full window, cycle day, and personalized tips in one place.',
          action: 'fertility',
        },
        {
          id: 'fertile-signs',
          ionIcon: 'eye-outline',
          accentHex: '#0d9488',
          title: 'Tune into signs',
          body: input.ovulationPattern
            ? 'Your discharge or LH-style logs align with this window — keep noting how you feel.'
            : 'Mood, energy, and cervical fluid can be useful clues — log them today.',
          action: 'symptoms',
        },
      ],
      context,
    };
  }

  // luteal
  const daysLeft =
    daysToNextPeriod != null ? Math.max(0, daysToNextPeriod) : null;
  return {
    phase: 'luteal',
    headline: 'Pre-period phase',
    subtitle:
      daysLeft != null
        ? `Period may start in about ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Extra rest helps.`
        : 'Your body is winding down — gentle care and symptom logs help.',
    cards: [
      {
        id: 'luteal-pms',
        ionIcon: 'moon-outline',
        accentHex: '#9333ea',
        title: input.prePeriodPattern ? 'Your usual pre-period signs' : 'Soothe PMS gently',
        body: input.prePeriodPattern
          ? 'You often log similar symptoms before your period — expect them and plan extra rest.'
          : 'Rest, magnesium-rich foods, and calm movement can ease the luteal phase.',
        action: 'symptoms',
      },
      {
        id: 'luteal-mood',
        ionIcon: 'heart-half-outline',
        accentHex: '#db2777',
        title: 'Mood check-in',
        body: `Day ${cycleDay} of ${cycleLength} — logging feelings now builds a clearer monthly picture.`,
        action: 'symptoms',
      },
      {
        id: 'luteal-ahead',
        ionIcon: 'time-outline',
        accentHex: '#f97316',
        title: 'Prepare ahead',
        body:
          daysLeft != null
            ? `About ${daysLeft} days until your next period — note cravings or cramps you often get.`
            : 'Note cravings or cramps so you know what to expect next cycle.',
        action: 'calendar',
      },
    ],
    context,
  };
}
