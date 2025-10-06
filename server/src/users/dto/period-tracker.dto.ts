export class PeriodTrackerResponseDto {
  nextPeriodDate: Date;
  ovulationDate: Date;
  fertileWindow: {
    start: Date;
    end: Date;
  };
  currentCycleDay: number;
  cycleLength: number;
}
