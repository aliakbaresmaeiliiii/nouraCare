import type { ReproductiveStatus } from '../services/onboarding.service';
import { REPRODUCTIVE_STATUS_OPTIONS } from './reproductive-status-options';
import type {
  ReproductiveHomeStatus,
  ReproductiveStatusOption,
  ReproductiveUiStatus,
} from './reproductive-status.model';

/** Normalize any API / journey / local string → picker UI key. */
export function normalizeReproductiveUiStatus(
  raw: string | null | undefined,
): ReproductiveUiStatus {
  if (!raw) return 'NOT_PREGNANT';

  const key = String(raw).replace(/\s+/g, '_').toUpperCase();

  const map: Record<string, ReproductiveUiStatus> = {
    PREGNANT: 'PREGNANT',
    EXPECTING: 'PREGNANT',
    PLANNING_PREGNANCY: 'PLANNING_PREGNANCY',
    TRYING: 'PLANNING_PREGNANCY',
    TRYING_TO_CONCEIVE: 'PLANNING_PREGNANCY',
    PLANNING: 'PLANNING_PREGNANCY',
    POSTPARTUM: 'POSTPARTUM',
    HAS_CHILD: 'POSTPARTUM',
    NOT_PREGNANT: 'NOT_PREGNANT',
    CYCLE: 'NOT_PREGNANT',
    CYCLE_TRACKING: 'NOT_PREGNANT',
    TRACKING: 'NOT_PREGNANT',
    MENOPAUSE: 'MENOPAUSE',
    PERIMENOPAUSE: 'MENOPAUSE',
  };

  return map[key] ?? 'NOT_PREGNANT';
}

export function findReproductiveStatusOption(
  uiStatus: string | null | undefined,
): ReproductiveStatusOption | undefined {
  const normalized = normalizeReproductiveUiStatus(uiStatus);
  return REPRODUCTIVE_STATUS_OPTIONS.find((o) => o.uiStatus === normalized);
}

export function uiStatusToApiState(
  uiStatus: string | null | undefined,
): ReproductiveStatus {
  const option = findReproductiveStatusOption(uiStatus);
  if (option) return option.apiState;

  const normalized = normalizeReproductiveUiStatus(uiStatus);
  if (normalized === 'POSTPARTUM') return 'postpartum';
  return 'cycle';
}

export function apiStateToUiStatus(
  state: ReproductiveStatus | string | null | undefined,
): ReproductiveUiStatus {
  return normalizeReproductiveUiStatus(state);
}

export function uiStatusToHomeStatus(
  uiStatus: string | null | undefined,
): ReproductiveHomeStatus {
  const option = findReproductiveStatusOption(uiStatus);
  if (option) return option.homeStatus;

  const normalized = normalizeReproductiveUiStatus(uiStatus);
  if (normalized === 'POSTPARTUM') return 'Postpartum';
  return 'Cycle Tracking';
}

/** Whether the given picker card should appear selected. */
export function isReproductiveUiStatusSelected(
  current: string | null | undefined,
  candidate: string,
  opts?: { planningPending?: boolean },
): boolean {
  if (
    candidate === 'PLANNING_PREGNANCY' &&
    opts?.planningPending
  ) {
    return true;
  }
  return normalizeReproductiveUiStatus(current) ===
    normalizeReproductiveUiStatus(candidate);
}
