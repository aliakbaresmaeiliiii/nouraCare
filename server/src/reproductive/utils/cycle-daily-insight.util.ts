/**
 * Phase-specific, science-informed daily cycle insights for the home hero line.
 * Used as rule-based fallback and as context seed for optional AI enrichment.
 */

export interface DailyInsightBuildInput {
  phase: 'none' | 'period' | 'follicular' | 'fertile' | 'luteal';
  cycleDay: number;
  periodDay: number | null;
  avgBleed: number;
  cycleLength: number;
  daysToNextPeriod: number | null;
  daysToOvulation: number | null;
  prePeriodPattern: boolean;
  ovulationPattern: boolean;
}

function buildPeriodDayInsight(periodDay: number, avgBleed: number): string {
  if (periodDay === 1) {
    return (
      'Day 1 of menstruation: progesterone and estrogen drop sharply, triggering uterine lining shedding. ' +
      'Prostaglandins rise and can cause cramps; rest, warmth, and steady hydration ease early symptoms.'
    );
  }
  if (periodDay === 2) {
    return (
      'Day 2 of menstruation: flow is often heaviest as the endometrium sheds. ' +
      'Prostaglandin levels may peak, intensifying cramps. Low iron and fatigue are common — prioritize iron-rich foods and fluids.'
    );
  }
  if (periodDay === 3) {
    return (
      'Day 3 of menstruation: shedding continues but flow often starts to lighten. ' +
      'Hormones remain low; gentle movement and magnesium-rich foods may help ease muscle tension.'
    );
  }
  if (periodDay >= avgBleed) {
    return (
      `Day ${periodDay} of menstruation: bleeding usually tapers as the lining finishes shedding. ` +
      'Estrogen begins a slow rise — energy may improve over the next few days.'
    );
  }
  return (
    `Day ${periodDay} of ~${avgBleed} menstruation days: the uterus is actively shedding its lining. ` +
    'Track flow and cramps — patterns here help refine predictions for ovulation and your next cycle.'
  );
}

function buildFollicularInsight(
  cycleDay: number,
  cycleLength: number,
  daysToOvulation: number | null,
): string {
  const ovHint =
    daysToOvulation != null && daysToOvulation > 0
      ? `Ovulation is likely in about ${daysToOvulation} day${daysToOvulation === 1 ? '' : 's'}. `
      : '';
  return (
    `Cycle day ${cycleDay} of ${cycleLength} (follicular phase): estrogen rises as follicles mature in the ovaries. ` +
    ovHint +
    'Many people feel rising energy — moderate exercise and balanced meals support this phase.'
  );
}

function buildFertileInsight(
  daysToOvulation: number | null,
  ovulationPattern: boolean,
): string {
  if (daysToOvulation === 0) {
    return (
      'Likely ovulation day: a mature egg is released. LH surges 24–36 hours before release; ' +
      'cervical mucus often becomes clear and stretchy. This is the peak conception window if you are trying.'
    );
  }
  const patternNote = ovulationPattern
    ? 'Your logged ovulation signs (discharge, LH tests, etc.) align with this window. '
    : '';
  const timing =
    daysToOvulation != null && daysToOvulation > 0
      ? `Ovulation expected in about ${daysToOvulation} day${daysToOvulation === 1 ? '' : 's'}. `
      : '';
  return (
    'Fertile window: sperm can survive up to ~5 days while the egg lives ~12–24 hours after ovulation. ' +
    patternNote +
    timing +
    'These are your highest-conception days this cycle.'
  );
}

function buildLutealInsight(
  cycleDay: number,
  cycleLength: number,
  daysToNextPeriod: number | null,
  prePeriodPattern: boolean,
): string {
  const daysLeft =
    daysToNextPeriod != null ? Math.max(0, daysToNextPeriod) : null;
  const timing =
    daysLeft != null
      ? `Period may start in about ${daysLeft} day${daysLeft === 1 ? '' : 's'}. `
      : '';
  const patternNote = prePeriodPattern
    ? 'You often log similar pre-period symptoms — progesterone drops before bleeding begins. '
    : 'Progesterone peaks then falls before menstruation — PMS-like symptoms are common. ';
  return (
    `Cycle day ${cycleDay} of ${cycleLength} (luteal phase): the corpus luteum produces progesterone to support the uterine lining. ` +
    timing +
    patternNote +
    'Extra rest, hydration, and symptom logging help you prepare.'
  );
}

/** True when text is the old prediction-tuning copy, not a phase daily insight. */
export function isPredictionTuningInsight(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  return (
    /Using a ~\d+-day cycle with adaptive tracking/i.test(t) ||
    /recent cycle lengths show a gentle drift/i.test(t) ||
    /Past predictions were off by about/i.test(t) ||
    /often log similar symptoms a few days before your period—treating that as a soft pattern/i.test(
      t,
    ) ||
    /Ovulation-style notes.*fertile timing is nudged/i.test(t)
  );
}

export function buildRuleBasedDailyInsight(input: DailyInsightBuildInput): string {
  if (input.phase === 'none' || input.cycleDay < 1) {
    return 'Log your last period start to unlock personalized daily guidance based on your cycle phase.';
  }

  if (input.phase === 'period' && input.periodDay != null) {
    return buildPeriodDayInsight(input.periodDay, input.avgBleed);
  }

  if (input.phase === 'follicular') {
    return buildFollicularInsight(
      input.cycleDay,
      input.cycleLength,
      input.daysToOvulation,
    );
  }

  if (input.phase === 'fertile') {
    return buildFertileInsight(input.daysToOvulation, input.ovulationPattern);
  }

  return buildLutealInsight(
    input.cycleDay,
    input.cycleLength,
    input.daysToNextPeriod,
    input.prePeriodPattern,
  );
}
