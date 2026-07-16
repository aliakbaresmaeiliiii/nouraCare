import type { ReproductiveStatusOption } from './reproductive-status.model';

/**
 * Single source of truth for the «وضعیت شما» 2×2 picker.
 * Reuse this list in Profile, Onboarding, or any future surface.
 *
 * DOM order is LTR; in RTL the first column appears on the right, matching:
 *   [planning] [cycle]
 *   [menopause] [pregnant]
 */
export const REPRODUCTIVE_STATUS_OPTIONS: readonly ReproductiveStatusOption[] =
  [
    {
      uiStatus: 'NOT_PREGNANT',
      apiState: 'cycle',
      homeStatus: 'Cycle Tracking',
      labelKey: 'editProfile.trackCycle',
      imageSrc: 'assets/images/profile/trackCyclePeriod.jpg',
    },
    {
      uiStatus: 'PLANNING_PREGNANCY',
      apiState: 'planning',
      homeStatus: 'Trying to Conceive',
      labelKey: 'editProfile.getPregnant',
      imageSrc: 'assets/images/profile/getPregnent.jpg',
    },
    {
      uiStatus: 'PREGNANT',
      apiState: 'pregnant',
      homeStatus: 'Pregnant',
      labelKey: 'editProfile.trackPregnancy',
      imageSrc: 'assets/images/profile/trackPregnency.jpg',
    },
    {
      uiStatus: 'MENOPAUSE',
      apiState: 'menopause',
      homeStatus: 'Menopause',
      labelKey: 'editProfile.trackPerimenopause',
      imageSrc: 'assets/images/profile/perimenopause.jpg',
    },
  ] as const;
