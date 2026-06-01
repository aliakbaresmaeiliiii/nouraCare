export interface WeekData {
  week: number;
  title: string;
  babySize: string;
  babyWeight: string;
  babyLength: string;
  development: string[];
  symptoms: string[];
  nutrition: {
    foods: string[];
    avoid: string[];
    supplements: string[];
  };
  activities: {
    exercise: string[];
    relaxation: string[];
    preparation: string[];
  };
  intimacy: {
    safe: boolean;
    tips: string[];
    positions: string[];
  };
  medical: {
    appointments: string[];
    tests: string[];
    concerns: string[];
  };
  tips: string[];
  funFacts: string[];
}
