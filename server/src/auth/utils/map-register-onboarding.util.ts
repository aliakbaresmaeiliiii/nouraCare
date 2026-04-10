import { OnboardingDataDto } from '../../users/dto/onboarding.dto';
import { PregnancyStatus } from '../../users/dto/user.dto';

function mapClientPregnancyStatus(status: unknown): PregnancyStatus {
  const s = String(status ?? '')
    .toLowerCase()
    .replace(/\s+/g, '_');
  const map: Record<string, PregnancyStatus> = {
    pregnant: PregnancyStatus.PREGNANT,
    trying: PregnancyStatus.PLANNING_PREGNANCY,
    trying_to_conceive: PregnancyStatus.PLANNING_PREGNANCY,
    tracking: PregnancyStatus.PLANNING_PREGNANCY,
    postpartum: PregnancyStatus.POSTPARTUM,
    has_child: PregnancyStatus.HAS_CHILD,
    parent: PregnancyStatus.HAS_CHILD,
    not_planning: PregnancyStatus.NOT_PLANNING,
  };
  if (map[s]) {
    return map[s];
  }
  const up = String(status || '').toUpperCase();
  if ((Object.values(PregnancyStatus) as string[]).includes(up)) {
    return up as PregnancyStatus;
  }
  return PregnancyStatus.PLANNING_PREGNANCY;
}

function parseHealthGoals(raw: unknown): string[] {
  if (raw == null || raw === '') {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.filter((x): x is string => typeof x === 'string');
  }
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown;
      return Array.isArray(p)
        ? p.filter((x): x is string => typeof x === 'string')
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Maps client registration / localStorage onboarding (snake_case) to persisted DTO.
 */
export function mapRegisterOnboardingPayload(
  raw: unknown,
): OnboardingDataDto | null {
  if (raw == null || typeof raw !== 'object') {
    return null;
  }
  const o = raw as Record<string, unknown>;

  const pregnancyStatus = mapClientPregnancyStatus(
    o.pregnancy_status ?? o.pregnancyStatus,
  );

  let lastPeriodDate: Date | undefined;
  const lp = o.last_period ?? o.lastPeriodDate;
  if (lp != null && lp !== '') {
    const d = new Date(String(lp));
    if (!Number.isNaN(d.getTime())) {
      lastPeriodDate = d;
    }
  }

  const cycleLength =
    typeof o.cycle_length === 'number'
      ? o.cycle_length
      : typeof o.cycleLength === 'number'
        ? o.cycleLength
        : undefined;

  const periodLength =
    typeof o.period_length === 'number'
      ? o.period_length
      : typeof o.periodLength === 'number'
        ? o.periodLength
        : undefined;

  let pregnancyWeek: number | undefined;
  const pw = o.pregnancy_week ?? o.pregnancyWeek;
  if (typeof pw === 'number' && Number.isFinite(pw)) {
    pregnancyWeek = Math.min(42, Math.max(1, Math.floor(pw)));
  }

  const healthGoals = parseHealthGoals(o.health_goals ?? o.healthGoals);

  let notificationsEnabled = true;
  const n = o.notifications ?? o.notificationsEnabled;
  if (typeof n === 'boolean') {
    notificationsEnabled = n;
  } else if (typeof n === 'string') {
    notificationsEnabled =
      n.toLowerCase() === 'yes' || n.toLowerCase() === 'true';
  }

  const onboardingStepRaw = o.onboarding_step ?? o.onboardingStep;
  const onboardingStep =
    typeof onboardingStepRaw === 'number' && Number.isFinite(onboardingStepRaw)
      ? Math.min(20, Math.max(1, Math.floor(onboardingStepRaw)))
      : 6;

  const dto: OnboardingDataDto = {
    pregnancyStatus,
    lastPeriodDate,
    cycleLength,
    periodLength,
    pregnancyWeek,
    healthGoals,
    notificationsEnabled,
    isCompleted: true,
    onboardingStep,
  };

  if (pregnancyWeek != null) {
    dto.pregnancyProgress = String(
      Math.min(100, Math.round((pregnancyWeek / 40) * 100)),
    );
  }

  return dto;
}
