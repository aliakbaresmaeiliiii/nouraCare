import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SymptomEntry {
  id?: number;
  userId: number;
  mood: string;
  symptoms?: string[];
  notes?: string;
  date: string;
  createdAt?: string;
}

export interface CycleEntry {
  id?: number;
  userId: number;
  periodStart: string;
  cycleLength: number;
  nextPeriod?: string;
  fertileDays?: string[];
  createdAt?: string;
}

export interface WeightEntry {
  id?: number;
  userId: number;
  weight: number;
  notes?: string;
  date: string;
  createdAt?: string;
}

export interface BloodPressureEntry {
  id?: number;
  userId: number;
  systolic: number;
  diastolic: number;
  date: string;
  notes?: string;
  createdAt?: string;
}

export interface SleepEntry {
  id?: number;
  userId: number;
  sleepHours: number;
  sleepQuality: string;
  date: string;
  notes?: string;
  createdAt?: string;
}

export interface WaterIntakeEntry {
  id?: number;
  userId: number;
  amount: number;
  date: string;
  createdAt?: string;
}

export interface KickCountEntry {
  id?: number;
  userId: number;
  kickCount: number;
  duration: number; // in minutes
  date: string;
  notes?: string;
  createdAt?: string;
}

export interface ContractionEntry {
  id?: number;
  userId: number;
  startTime: string;
  endTime?: string;
  duration?: number; // in seconds
  intensity?: string;
  date: string;
  createdAt?: string;
}

export interface PregnancyProgress {
  id?: number;
  userId: number;
  pregnancyWeek: number;
  dueDate: string;
  notes?: string;
  createdAt?: string;
}

export interface ExerciseEntry {
  id?: number;
  userId: number;
  exerciseType: string;
  duration: number; // in minutes
  trimester: string;
  date: string;
  notes?: string;
  createdAt?: string;
}

export interface MeditationEntry {
  id?: number;
  userId: number;
  duration: number; // in minutes
  type?: string;
  date: string;
  notes?: string;
  createdAt?: string;
}

export interface MoodEntry {
  id?: number;
  userId: number;
  mood: string;
  intensity?: number; // 1-10 scale
  notes?: string;
  date: string;
  createdAt?: string;
}

export interface GratitudeEntry {
  id?: number;
  userId: number;
  entry: string;
  date: string;
  createdAt?: string;
}

export interface MedicationReminder {
  id?: number;
  userId: number;
  medicationName: string;
  reminderTime: string;
  frequency: string; // daily, twice_daily, etc.
  isActive: boolean;
  createdAt?: string;
}

export interface VitaminEntry {
  id?: number;
  userId: number;
  vitaminType: string;
  date: string;
  taken: boolean;
  createdAt?: string;
}

export interface AppointmentReminder {
  id?: number;
  userId: number;
  appointmentType: string;
  appointmentDate: string;
  appointmentTime: string;
  reminderTime?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface HealthReport {
  userId: number;
  period: string; // weekly, monthly, yearly
  startDate: string;
  endDate: string;
  symptoms: SymptomEntry[];
  weight: WeightEntry[];
  bloodPressure: BloodPressureEntry[];
  sleep: SleepEntry[];
  waterIntake: WaterIntakeEntry[];
  mood: MoodEntry[];
  completionRate: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToolsService {
  private readonly apiUrl = environment.apiEndPoint;

  constructor(private http: HttpClient) {}

  // Symptom Tracking
  trackSymptoms(entry: SymptomEntry): Observable<SymptomEntry> {
    return this.http.post<SymptomEntry>(`${this.apiUrl}/symptoms`, entry);
  }

  getSymptoms(userId: number, date?: string): Observable<any[]> {
    const params: any = { userId: userId.toString() };
    if (date) {
      params.date = date;
    }
    return this.http.get<any[]>(`${this.apiUrl}/symptoms`, { params });
  }

  // Cycle Tracking
  trackCycle(entry: CycleEntry): Observable<CycleEntry> {
    return this.http.post<CycleEntry>(`${this.apiUrl}/cycle`, entry);
  }

  getCycleData(userId: number): Observable<CycleEntry[]> {
    return this.http.get<CycleEntry[]>(`${this.apiUrl}/cycle`, { params: { userId: userId.toString() } });
  }

  calculateFertileDays(cycleLength: number, lastPeriod: string): Observable<{ fertileDays: string[], nextPeriod: string }> {
    return this.http.post<{ fertileDays: string[], nextPeriod: string }>(`${this.apiUrl}/cycle/calculate`, {
      cycleLength,
      lastPeriod
    });
  }

  // Weight Tracking
  trackWeight(entry: WeightEntry): Observable<WeightEntry> {
    return this.http.post<WeightEntry>(`${this.apiUrl}/weight`, entry);
  }

  getWeightHistory(userId: number, period?: string): Observable<WeightEntry[]> {
    const params: any = { userId: userId.toString() };
    if (period) {
      params.period = period;
    }
    return this.http.get<WeightEntry[]>(`${this.apiUrl}/weight`, { params });
  }

  // Blood Pressure Tracking
  trackBloodPressure(entry: BloodPressureEntry): Observable<BloodPressureEntry> {
    return this.http.post<BloodPressureEntry>(`${this.apiUrl}/blood-pressure`, entry);
  }

  getBloodPressureHistory(userId: number, period?: string): Observable<BloodPressureEntry[]> {
    const params: any = { userId: userId.toString() };
    if (period) {
      params.period = period;
    }
    return this.http.get<BloodPressureEntry[]>(`${this.apiUrl}/blood-pressure`, { params });
  }

  // Sleep Tracking
  trackSleep(entry: SleepEntry): Observable<SleepEntry> {
    return this.http.post<SleepEntry>(`${this.apiUrl}/sleep`, entry);
  }

  getSleepHistory(userId: number, period?: string): Observable<SleepEntry[]> {
    const params: any = { userId: userId.toString() };
    if (period) {
      params.period = period;
    }
    return this.http.get<SleepEntry[]>(`${this.apiUrl}/sleep`, { params });
  }

  // Water Intake Tracking
  trackWaterIntake(entry: WaterIntakeEntry): Observable<WaterIntakeEntry> {
    return this.http.post<WaterIntakeEntry>(`${this.apiUrl}/water-intake`, entry);
  }

  getWaterIntakeHistory(userId: number, date?: string): Observable<WaterIntakeEntry[]> {
    const params: any = { userId: userId.toString() };
    if (date) {
      params.date = date;
    }
    return this.http.get<WaterIntakeEntry[]>(`${this.apiUrl}/water-intake`, { params });
  }

  // Pregnancy Tools
  startKickCounter(userId: number): Observable<{ sessionId: string, startTime: string }> {
    return this.http.post<{ sessionId: string, startTime: string }>(`${this.apiUrl}/kick-counter/start`, { userId });
  }

  recordKickCount(sessionId: string, kickCount: number): Observable<KickCountEntry> {
    return this.http.post<KickCountEntry>(`${this.apiUrl}/kick-counter/record`, { sessionId, kickCount });
  }

  startContractionTimer(userId: number): Observable<{ sessionId: string, startTime: string }> {
    return this.http.post<{ sessionId: string, startTime: string }>(`${this.apiUrl}/contraction-timer/start`, { userId });
  }

  stopContractionTimer(sessionId: string): Observable<ContractionEntry> {
    return this.http.post<ContractionEntry>(`${this.apiUrl}/contraction-timer/stop`, { sessionId });
  }

  calculateDueDate(lastPeriod: string): Observable<{ dueDate: string, pregnancyWeek: number }> {
    return this.http.post<{ dueDate: string, pregnancyWeek: number }>(`${this.apiUrl}/pregnancy/calculate-due-date`, { lastPeriod });
  }

  trackPregnancyProgress(entry: PregnancyProgress): Observable<PregnancyProgress> {
    return this.http.post<PregnancyProgress>(`${this.apiUrl}/pregnancy/progress`, entry);
  }

  // Wellness Tools
  getExercisePlan(trimester: string): Observable<{ exercises: any[], recommendations: string[] }> {
    return this.http.get<{ exercises: any[], recommendations: string[] }>(`${this.apiUrl}/exercise/plan`, { 
      params: { trimester } 
    });
  }

  trackExercise(entry: ExerciseEntry): Observable<ExerciseEntry> {
    return this.http.post<ExerciseEntry>(`${this.apiUrl}/exercise`, entry);
  }

  startMeditationSession(userId: number, duration: number): Observable<{ sessionId: string, startTime: string }> {
    return this.http.post<{ sessionId: string, startTime: string }>(`${this.apiUrl}/meditation/start`, { userId, duration });
  }

  completeMeditationSession(sessionId: string): Observable<MeditationEntry> {
    return this.http.post<MeditationEntry>(`${this.apiUrl}/meditation/complete`, { sessionId });
  }

  trackMood(entry: MoodEntry): Observable<MoodEntry> {
    return this.http.post<MoodEntry>(`${this.apiUrl}/mood`, entry);
  }

  getMoodHistory(userId: number, period?: string): Observable<MoodEntry[]> {
    const params: any = { userId: userId.toString() };
    if (period) {
      params.period = period;
    }
    return this.http.get<MoodEntry[]>(`${this.apiUrl}/mood`, { params });
  }

  saveGratitudeEntry(entry: GratitudeEntry): Observable<GratitudeEntry> {
    return this.http.post<GratitudeEntry>(`${this.apiUrl}/gratitude`, entry);
  }

  getGratitudeHistory(userId: number, period?: string): Observable<GratitudeEntry[]> {
    const params: any = { userId: userId.toString() };
    if (period) {
      params.period = period;
    }
    return this.http.get<GratitudeEntry[]>(`${this.apiUrl}/gratitude`, { params });
  }

  // Medication & Reminders
  setMedicationReminder(reminder: MedicationReminder): Observable<MedicationReminder> {
    return this.http.post<MedicationReminder>(`${this.apiUrl}/medication-reminders`, reminder);
  }

  getMedicationReminders(userId: number): Observable<MedicationReminder[]> {
    return this.http.get<MedicationReminder[]>(`${this.apiUrl}/medication-reminders`, { 
      params: { userId: userId.toString() } 
    });
  }

  trackVitamin(entry: VitaminEntry): Observable<VitaminEntry> {
    return this.http.post<VitaminEntry>(`${this.apiUrl}/vitamins`, entry);
  }

  getVitaminHistory(userId: number, date?: string): Observable<VitaminEntry[]> {
    const params: any = { userId: userId.toString() };
    if (date) {
      params.date = date;
    }
    return this.http.get<VitaminEntry[]>(`${this.apiUrl}/vitamins`, { params });
  }

  setAppointmentReminder(reminder: AppointmentReminder): Observable<AppointmentReminder> {
    return this.http.post<AppointmentReminder>(`${this.apiUrl}/appointment-reminders`, reminder);
  }

  getAppointmentReminders(userId: number): Observable<AppointmentReminder[]> {
    return this.http.get<AppointmentReminder[]>(`${this.apiUrl}/appointment-reminders`, { 
      params: { userId: userId.toString() } 
    });
  }

  // Progress & Reports
  generateHealthReport(userId: number, period: string, startDate: string, endDate: string): Observable<HealthReport> {
    return this.http.post<HealthReport>(`${this.apiUrl}/health-reports`, {
      userId,
      period,
      startDate,
      endDate
    });
  }

  getHealthReport(userId: number, reportId: number): Observable<HealthReport> {
    return this.http.get<HealthReport>(`${this.apiUrl}/health-reports/${reportId}`, {
      params: { userId: userId.toString() }
    });
  }

  analyzeTrends(userId: number, metric: string, period: string): Observable<{ trends: any[], insights: string[] }> {
    return this.http.get<{ trends: any[], insights: string[] }>(`${this.apiUrl}/trends/analyze`, {
      params: { userId: userId.toString(), metric, period }
    });
  }

  // Utility Methods
  getTodayStats(userId: number): Observable<{
    symptoms: number;
    weight: boolean;
    bloodPressure: boolean;
    sleep: boolean;
    waterIntake: number;
    mood: string;
    vitamins: string[];
    completionRate: number;
  }> {
    return this.http.get<{
      symptoms: number;
      weight: boolean;
      bloodPressure: boolean;
      sleep: boolean;
      waterIntake: number;
      mood: string;
      vitamins: string[];
      completionRate: number;
    }>(`${this.apiUrl}tools/today-stats`, { params: { userId: userId.toString() } });
  }

  getWeeklyProgress(userId: number): Observable<{
    week: number;
    totalEntries: number;
    completionRate: number;
    highlights: string[];
  }> {
    return this.http.get<{
      week: number;
      totalEntries: number;
      completionRate: number;
      highlights: string[];
    }>(`${this.apiUrl}/tools/weekly-progress`, { params: { userId: userId.toString() } });
  }
}
