import { OnboardingDataDto } from '../../users/dto/onboarding.dto';
import { PregnancyStatus } from '../../users/dto/user.dto';
import { InitializeReproductiveStateDto } from '../../reproductive/dto/initialize-reproductive-state.dto';
import { normalizeIsoDateOnlyInput } from '../../reproductive/utils/pregnancy-lmp.util';

/**
 * Maps persisted registration onboarding row → reproductive domain init payload.
 * Registration used to only write `onboarding_data`, leaving `reproductive_state`
 * unset so GET /dashboard defaulted to `cycle` (period ring) for pregnant/postpartum users.
 */
export function mapOnboardingToReproductiveInit(
  dto: OnboardingDataDto,
): InitializeReproductiveStateDto | null {
  const status = dto.pregnancyStatus;
  if (!status) {
    return null;
  }

  const lmpIso = dto.lastPeriodDate
    ? normalizeIsoDateOnlyInput(dto.lastPeriodDate)
    : null;

  if (status === PregnancyStatus.PREGNANT) {
    return {
      state: 'pregnant',
      pregnancyStartDate: lmpIso ?? undefined,
      currentWeek: dto.pregnancyWeek,
      cycleLength: dto.cycleLength,
    };
  }

  if (
    status === PregnancyStatus.POSTPARTUM ||
    status === PregnancyStatus.HAS_CHILD
  ) {
    return {
      state: 'postpartum',
      lastPeriodDate: lmpIso ?? undefined,
      cycleLength: dto.cycleLength,
    };
  }

  if (
    status === PregnancyStatus.PLANNING_PREGNANCY ||
    status === PregnancyStatus.NOT_PLANNING
  ) {
    const state =
      status === PregnancyStatus.PLANNING_PREGNANCY ? 'planning' : 'cycle';
    return {
      state,
      lastPeriodDate: lmpIso ?? undefined,
      cycleLength: dto.cycleLength,
      tryingSince:
        state === 'planning' ? lmpIso ?? undefined : undefined,
    };
  }

  return null;
}
