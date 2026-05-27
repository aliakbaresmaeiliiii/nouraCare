export interface UpdateReproductiveStateDto {
  state: 'cycle' | 'planning' | 'pregnant' | 'postpartum';
  
  pregnancyStartDate?: string;
  pregnancyDueDate?: string;
  tryingSince?: string;
  notes?: string;
  lastPeriodDate?: string;
  cycleLength?: number;
  currentWeek?: number;
}
