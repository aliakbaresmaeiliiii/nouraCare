export interface UpdateReproductiveStateDto {
  state: 'cycle' | 'planning' | 'pregnant' | 'postpartum' | 'menopause';

  pregnancyStartDate?: string;
  pregnancyDueDate?: string;
  tryingSince?: string;
  notes?: string;
  lastPeriodDate?: string;
  cycleLength?: number;
  currentWeek?: number;
  menopauseStage?: 'perimenopause' | 'menopause';
}
