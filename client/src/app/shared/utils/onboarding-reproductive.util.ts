import type {
  InitializeReproductiveStateDto,
  ReproductiveStatus,
} from '@app/shared/services/onboarding.service';
import { uiStatusToApiState } from '@app/shared/reproductive-status/reproductive-status.mapper';
import { normalizeLmpInput } from '@app/shared/utils/pregnancy-lmp.util';

/** Shape of `localStorage.onboarding_data` written by the onboarding flow. */
export interface LocalOnboardingAnswers {
  pregnancy_status?: string;
  lmp_date?: string | null;
  last_period?: string | null;
  cycle_length?: number;
  pregnancy_week?: number;
  baby_birth_date?: string | null;
}

/**
 * Maps local onboarding answers → POST /onboarding reproductive init payload.
 * Accepts the same status vocabulary as Profile («وضعیت شما»):
 * API states (`cycle` | `planning` | `pregnant` | `menopause`) and UI keys
 * (`NOT_PREGNANT` | `PLANNING_PREGNANCY` | …), plus legacy `trying` / `postpartum`.
 */
export function mapLocalOnboardingToReproductiveInit(
  data: LocalOnboardingAnswers | null | undefined,
): InitializeReproductiveStateDto | null {
  if (!data) {
    return null;
  }
  const raw = String(data.pregnancy_status ?? '').trim();
  if (!raw) {
    return null;
  }

  const mappedState: ReproductiveStatus = uiStatusToApiState(raw);
  const lmp = normalizeLmpInput(data.lmp_date ?? data.last_period);

  return {
    state: mappedState,
    lastPeriodDate: mappedState === 'postpartum' ? undefined : lmp || undefined,
    cycleLength: data.cycle_length || undefined,
    tryingSince: mappedState === 'planning' ? lmp || undefined : undefined,
    pregnancyStartDate: mappedState === 'pregnant' ? lmp || undefined : undefined,
  };
}
