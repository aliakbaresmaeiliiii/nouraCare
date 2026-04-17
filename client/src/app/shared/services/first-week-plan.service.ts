import { Injectable } from '@angular/core';

const STORAGE_START = 'first_week_plan_start_iso';
const STORAGE_LAST_NUDGE = 'first_week_last_nudge_date';
export type FirstWeekInsightTier = 1 | 2 | 3;

export interface FirstWeekDayPlan {
  day: number;
  headline: string;
  body: string;
  microActionLabel: string;
  insightTitle: string;
  insightBody: string;
  insightTier: FirstWeekInsightTier;
  reminderTitle: string;
  reminderBody: string;
}

@Injectable({ providedIn: 'root' })
export class FirstWeekPlanService {
  /** Call after onboarding save or on home when user is clearly active. */
  ensurePlanStarted(): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const completed = localStorage.getItem('onboarding_completed') === 'true';
    if (!completed) {
      return;
    }
    if (localStorage.getItem(STORAGE_START)) {
      return;
    }
    localStorage.setItem(STORAGE_START, new Date().toISOString());
  }

  resetPlanForTesting(): void {
    localStorage.removeItem(STORAGE_START);
    localStorage.removeItem(STORAGE_LAST_NUDGE);
  }

  isInFirstWeek(): boolean {
    const day = this.getPlanDayNumber();
    return day !== null && day >= 1 && day <= 7;
  }

  /**
   * Calendar day index within the first week (1–7), or null if plan inactive / week ended.
   */
  getPlanDayNumber(): number | null {
    const startIso = localStorage.getItem(STORAGE_START);
    if (!startIso) {
      return null;
    }
    const start = new Date(startIso);
    if (Number.isNaN(start.getTime())) {
      return null;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    const diffMs = today.getTime() - start.getTime();
    const day = Math.floor(diffMs / (86_400_000)) + 1;
    if (day < 1 || day > 7) {
      return null;
    }
    return day;
  }

  getPlanForToday(): FirstWeekDayPlan | null {
    const day = this.getPlanDayNumber();
    if (day === null) {
      return null;
    }
    return FIRST_WEEK_PLANS[day - 1];
  }

  notificationsOptIn(): boolean {
    return localStorage.getItem('notifications_enabled') !== 'false';
  }

  /**
   * One gentle nudge per calendar day while in week 1 (browser notification if allowed, else caller uses toast).
   * @returns message to show as toast when notification was not shown
   */
  consumeDailyNudgeIfDue(): { showedNotification: boolean; toastFallback?: string } {
    if (!this.isInFirstWeek()) {
      return { showedNotification: false };
    }
    const plan = this.getPlanForToday();
    if (!plan) {
      return { showedNotification: false };
    }
    const todayKey = this.todayDateKey();
    const last = localStorage.getItem(STORAGE_LAST_NUDGE);
    if (last === todayKey) {
      return { showedNotification: false };
    }
    localStorage.setItem(STORAGE_LAST_NUDGE, todayKey);

    const title = plan.reminderTitle;
    const body = plan.reminderBody;

    if (
      this.notificationsOptIn() &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      try {
        new Notification(title, { body, tag: 'first-week-daily' });
        return { showedNotification: true };
      } catch {
        /* fall through */
      }
    }
    return { showedNotification: false, toastFallback: `${title} — ${body}` };
  }

  private todayDateKey(): string {
    return new Date().toISOString().split('T')[0];
  }
}

const FIRST_WEEK_PLANS: FirstWeekDayPlan[] = [
  {
    day: 1,
    headline: 'Day 1 — start small',
    body: 'One quick check-in builds the habit. Everything here is designed to take under 10 seconds.',
    microActionLabel: 'Log mood',
    insightTitle: 'Your first insight',
    insightBody:
      'A glass of water now can ease tomorrow’s headaches and cramps. Sip once before you leave Home.',
    insightTier: 1,
    reminderTitle: 'Gentle nudge',
    reminderBody: 'Take 10 seconds: tap how you feel today.',
  },
  {
    day: 2,
    headline: 'Day 2 — notice your body',
    body: 'Pick one tiny signal: energy, cramps, calm, or tension. No need for a long journal.',
    microActionLabel: 'Log mood',
    insightTitle: 'Insight',
    insightBody:
      'Mood shifts often track sleep and hydration more than “willpower.” Small tweaks beat big guilt.',
    insightTier: 1,
    reminderTitle: 'Today’s check-in',
    reminderBody: 'How are you feeling? One tap on Home is enough.',
  },
  {
    day: 3,
    headline: 'Day 3 — you’re building rhythm',
    body: 'Same place, same tiny action. Consistency matters more than perfection this week.',
    microActionLabel: 'Log mood',
    insightTitle: 'A bit deeper',
    insightBody:
      'If you track your cycle, symptoms on days 10–17 can hint at your fertile window — we’ll surface more as you log.',
    insightTier: 2,
    reminderTitle: 'Quick win waiting',
    reminderBody: 'Log mood or peek at today’s insight — under 10 seconds.',
  },
  {
    day: 4,
    headline: 'Day 4 — keep it light',
    body: 'If you miss a day, just continue. The app stays kind; progress is non-linear.',
    microActionLabel: 'Log mood',
    insightTitle: 'Pattern watch',
    insightBody:
      'Repeating symptoms three cycles in a row are worth mentioning to a clinician — logging makes that visible.',
    insightTier: 2,
    reminderTitle: 'Still here with you',
    reminderBody: 'Your daily micro-action is ready on Home.',
  },
  {
    day: 5,
    headline: 'Day 5 — add one detail (optional)',
    body: 'When you have time, add a symptom in the tracker. If not, mood alone still counts.',
    microActionLabel: 'Open tracker',
    insightTitle: 'Tools unlock slowly',
    insightBody:
      'Health Tools and charts stay available — we’re introducing them gradually so nothing feels overwhelming.',
    insightTier: 2,
    reminderTitle: 'Optional depth',
    reminderBody: 'Mood in seconds, or add a symptom when you’re ready.',
  },
  {
    day: 6,
    headline: 'Day 6 — reflect in a sentence',
    body: 'Name one word for today (“heavy”, “hopeful”, “tired”). That’s enough data to care for future-you.',
    microActionLabel: 'Log mood',
    insightTitle: 'Stronger signals',
    insightBody:
      'Across a week of moods, you’ll start to see what precedes rough days — patterns beat single snapshots.',
    insightTier: 3,
    reminderTitle: 'Almost one week',
    reminderBody: 'One more small check-in keeps the streak kind, not strict.',
  },
  {
    day: 7,
    headline: 'Day 7 — you made the first hill',
    body: 'Week one is about showing up, not mastering everything. Next week we’ll lean on what you already logged.',
    microActionLabel: 'Log mood',
    insightTitle: 'What’s next',
    insightBody:
      'You’ve earned fuller tips and cycle context. Explore insights and tools when curiosity strikes — no rush.',
    insightTier: 3,
    reminderTitle: 'Week one complete?',
    reminderBody: 'Celebrate with one mood log or your favorite insight.',
  },
];
