import { Injectable, Logger } from '@nestjs/common';
import { DailyInsightContext } from '../../types/cycle-dashboard.types';

/**
 * Optional AI layer for menstrual insights.
 * Controllers and domain services must not call external AI APIs directly.
 */
@Injectable()
export class PeriodAiService {
  private readonly logger = new Logger(PeriodAiService.name);

  isEnabled(): boolean {
    return Boolean(process.env.PERIOD_AI_ENABLED === 'true' && process.env.PERIOD_AI_API_KEY);
  }

  /**
   * Generate a daily insight via AI when configured; otherwise returns null
   * so callers can fall back to rule-based text.
   */
  async generateDailyInsight(context: DailyInsightContext): Promise<string | null> {
    if (!this.isEnabled()) {
      return null;
    }

    const endpoint = process.env.PERIOD_AI_ENDPOINT;
    const apiKey = process.env.PERIOD_AI_API_KEY;
    if (!endpoint || !apiKey) {
      return null;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          cycleDay: context.cycleDay,
          periodDay: context.periodDay,
          phase: context.phase,
          avgCycleLength: context.avgCycleLength,
          avgPeriodLength: context.avgPeriodLength,
          confidence: context.confidence,
          daysToNextPeriod: context.daysToNextPeriod,
          daysToOvulation: context.daysToOvulation,
          prePeriodPattern: context.prePeriodPattern,
          ovulationPattern: context.ovulationPattern,
          ruleBasedInsight: context.ruleBasedInsight,
          prompt:
            'Write one concise paragraph (2–3 sentences) of science-informed, empathetic daily menstrual ' +
            'cycle guidance for the user based on the JSON context. Reference the exact cycle/period day ' +
            'and phase physiology (hormones, lining shedding, ovulation, luteal progesterone). ' +
            'No diagnosis, no alarmism, no bullet points — plain prose only.',
        }),
        signal: AbortSignal.timeout(12_000),
      });

      if (!response.ok) {
        this.logger.warn(`Period AI request failed: HTTP ${response.status}`);
        return null;
      }

      const body = (await response.json()) as { insight?: string };
      const text = body.insight?.trim();
      return text && text.length > 0 ? text : null;
    } catch (err) {
      this.logger.warn(`Period AI unavailable: ${(err as Error).message}`);
      return null;
    }
  }
}
