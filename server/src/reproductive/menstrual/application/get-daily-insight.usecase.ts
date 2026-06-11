import { Injectable } from '@nestjs/common';
import { daily_insight_source } from '@prisma/client';
import { isPredictionTuningInsight } from '../../utils/cycle-daily-insight.util';
import { DailyInsightContext } from '../types/cycle-dashboard.types';
import { PeriodAiService } from '../infrastructure/ai/period-ai.service';
import { InsightRepository } from '../infrastructure/persistence/insight.repository';

export interface GetDailyInsightInput {
  userId: number;
  context: DailyInsightContext;
  referenceDate?: Date;
}

export interface GetDailyInsightResult {
  insight: string;
  source: daily_insight_source;
  cached: boolean;
}

@Injectable()
export class GetDailyInsightUseCase {
  constructor(
    private readonly insightRepository: InsightRepository,
    private readonly periodAiService: PeriodAiService,
  ) {}

  async execute(input: GetDailyInsightInput): Promise<GetDailyInsightResult> {
    const referenceDate = input.referenceDate ?? new Date();
    const cached = await this.insightRepository.findCached(input.userId, referenceDate);
    if (cached && !isPredictionTuningInsight(cached.insight)) {
      return { insight: cached.insight, source: cached.source, cached: true };
    }

    let insight = input.context.ruleBasedInsight;
    let source: daily_insight_source = daily_insight_source.RULE;

    if (this.periodAiService.isEnabled()) {
      const aiInsight = await this.periodAiService.generateDailyInsight(input.context);
      if (aiInsight) {
        insight = aiInsight;
        source = daily_insight_source.AI;
      }
    }

    await this.insightRepository.save(input.userId, insight, source, referenceDate);
    return { insight, source, cached: false };
  }

  async invalidateForUser(userId: number): Promise<void> {
    await this.insightRepository.invalidateForUser(userId);
  }
}
