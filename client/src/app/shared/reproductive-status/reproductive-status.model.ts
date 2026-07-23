import type { ReproductiveStatus } from '@app/shared/services/onboarding.service';

/**
 * Profile / picker UI keys (legacy journey vocabulary).
 * Keep these stable — Home + Profile selection state depend on them.
 */
export type ReproductiveUiStatus =
  | 'NOT_PREGNANT'
  | 'PLANNING_PREGNANCY'
  | 'PREGNANT'
  | 'MENOPAUSE'
  | 'POSTPARTUM';

/** Local home display string stored in CycleSettingsService.userStatus */
export type ReproductiveHomeStatus =
  | 'Cycle Tracking'
  | 'Trying to Conceive'
  | 'Pregnant'
  | 'Postpartum'
  | 'Menopause'
  | 'Not Set';

export interface ReproductiveStatusOption {
  /** UI / profile selection key */
  uiStatus: Exclude<ReproductiveUiStatus, 'POSTPARTUM'>;
  /** Canonical API reproductive_state */
  apiState: Extract<
    ReproductiveStatus,
    'cycle' | 'planning' | 'pregnant' | 'menopause'
  >;
  /** CycleSettingsService.userStatus after save */
  homeStatus: Exclude<ReproductiveHomeStatus, 'Postpartum' | 'Not Set'>;
  labelKey: string;
  imageSrc: string;
}
