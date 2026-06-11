import { CyclePhaseGuidePayload } from '../../utils/cycle-phase-guide.util';

export interface CycleDashboardPayload {
  nextPeriod: Date | null;
  cycleLength: number | null;
  cycleDay: number | null;
  ovulationDate: string | null;
  fertileWindow: { start: string; end: string } | null;
  confidence: number;
  avgCycleLength: number;
  avgPeriodLength: number;
  insight: string;
  phaseGuide: CyclePhaseGuidePayload;
  tips: string[];
}

export interface DailyInsightContext {
  cycleDay: number | null;
  periodDay: number | null;
  phase: string;
  avgCycleLength: number;
  avgPeriodLength: number;
  confidence: number;
  daysToNextPeriod: number | null;
  daysToOvulation: number | null;
  prePeriodPattern: boolean;
  ovulationPattern: boolean;
  ruleBasedInsight: string;
}
