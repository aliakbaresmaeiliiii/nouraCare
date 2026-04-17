import type { EngagementTier } from './health-engagement.types';

export const DEFAULT_EVENING_HOUR_UTC = 20;

export function utcDateIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/** score = opens*2 + logs*3 - inactivity*1.5 */
export function computeEngagementScore(
  opens30d: number,
  logs30d: number,
  inactivityDays: number,
): number {
  const raw = opens30d * 2 + logs30d * 3 - inactivityDays * 1.5;
  return Math.round(raw * 10) / 10;
}

export function tierFromScore(score: number): EngagementTier {
  if (score >= 28) return 'HIGH';
  if (score >= 12) return 'MEDIUM';
  return 'LOW';
}

export function periodReminderLeadDays(tier: EngagementTier): number {
  if (tier === 'LOW') return 1;
  return 2;
}

export function minDaysBetweenSoftNotifications(ignored: number): number {
  if (ignored >= 5) return 4;
  if (ignored >= 3) return 3;
  if (ignored >= 1) return 2;
  return 1;
}

export function isSoftNotification(type: string): boolean {
  return type === 'FERTILE_WINDOW' || type === 'PREGNANCY_INSIGHT' || type === 'RE_ENGAGEMENT';
}
