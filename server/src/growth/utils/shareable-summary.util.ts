import { utcDateIso } from '../../health-engagement/health-engagement.util';

const APP = 'NouraCare';

function fmtIsoDay(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v.slice(0, 10);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return null;
}

function daysUntilFromIso(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.UTC(
    Number(iso.slice(0, 4)),
    Number(iso.slice(5, 7)) - 1,
    Number(iso.slice(8, 10)),
  );
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((t - today) / 86400000);
}

/**
 * Builds a short, privacy-conscious blurb for social sharing (no email / name).
 */
export function buildShareableSummary(dashboard: Record<string, unknown>): {
  title: string;
  body: string;
  hashtags: string[];
} {
  const state = dashboard.state as string | undefined;
  const hashtags = ['#WomensHealth', '#CycleTracking', '#NouraCare'];

  if (state === 'pregnant') {
    const week = dashboard.week as number | null | undefined;
    const needs = dashboard.needsPregnancyInput as boolean | undefined;
    if (needs || week == null) {
      return {
        title: `My journey on ${APP}`,
        body: `I'm tracking my pregnancy with ${APP} — thoughtful, week-by-week guidance in one place.`,
        hashtags,
      };
    }
    return {
      title: `Week ${week} on ${APP}`,
      body: `I'm ${week} weeks along and using ${APP} for week-by-week pregnancy insights. Join me!`,
      hashtags: ['#Pregnancy', ...hashtags],
    };
  }

  const cycleDay = dashboard.cycleDay as number | null | undefined;
  const nextPeriod = fmtIsoDay(dashboard.nextPeriod);
  const ov = fmtIsoDay(dashboard.ovulationDate);
  const insight = (dashboard.insight as string | null | undefined)?.trim();
  const fw = dashboard.fertileWindow as { start?: string; end?: string } | null | undefined;

  const parts: string[] = [];
  if (typeof cycleDay === 'number' && cycleDay > 0) {
    parts.push(`Cycle day ${cycleDay}`);
  }
  const d = daysUntilFromIso(nextPeriod);
  if (d != null && d >= 0) {
    parts.push(`next period in ~${d}d`);
  } else if (nextPeriod) {
    parts.push(`next period ~${nextPeriod}`);
  }
  if (ov) {
    parts.push(`ovulation ~${ov}`);
  } else if (fw?.start && fw?.end) {
    parts.push(`fertile window ${fw.start.slice(0, 10)}–${fw.end.slice(0, 10)}`);
  }

  const headline =
    parts.length > 0 ? parts.join(' • ') : 'Tracking my cycle with personalized insights';

  const bodyLines = [
    `${headline}.`,
    insight ? `${insight}` : `Using ${APP} for cycle insights and daily check-ins.`,
    `Join me on ${APP}!`,
  ];

  return {
    title: `My cycle snapshot — ${APP}`,
    body: bodyLines.filter(Boolean).join('\n\n'),
    hashtags: ['#CycleTracking', '#Fertility', '#NouraCare'],
  };
}

export function utcTodayIso(): string {
  return utcDateIso(new Date());
}
