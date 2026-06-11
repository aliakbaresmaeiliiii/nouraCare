import { Injectable } from '@nestjs/common';
import {
  buildCyclePhaseGuide,
  CyclePhaseGuideInput,
  CyclePhaseGuidePayload,
} from '../../utils/cycle-phase-guide.util';
import {
  CyclePhase,
  determineCyclePhase,
  DeterminePhaseInput,
} from './cycle-phase.logic';

export type { CyclePhase, DeterminePhaseInput };
export { determineCyclePhase };

@Injectable()
export class CyclePhaseService {
  determinePhase(input: DeterminePhaseInput): Exclude<CyclePhase, 'none'> {
    return determineCyclePhase(input);
  }

  buildPhaseGuide(input: CyclePhaseGuideInput): CyclePhaseGuidePayload {
    return buildCyclePhaseGuide(input);
  }
}
