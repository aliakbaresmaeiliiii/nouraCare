import { inject, Injectable } from '@angular/core';
import { TranslationService } from '../../shared/services/translation.service';
import { LanguageService } from '../../shared/services/language.service';
import { formatCyclePhaseShortDate } from '../../shared/utils/locale-date-format.util';

@Injectable({
  providedIn: 'root',
})
export class SymptomsUIService {
  private readonly translation = inject(TranslationService);
  private readonly language = inject(LanguageService);

  /**
   * Get formatted date for display (locale-aware, Jalali when Persian).
   */
  getFormattedDate(selectedDate: string): string {
    const date = new Date(`${selectedDate}T12:00:00`);
    if (Number.isNaN(date.getTime())) {
      return selectedDate;
    }
    return formatCyclePhaseShortDate(date, this.language.getCurrentLanguage());
  }

  /**
   * Get pregnancy progress text
   */
  getPregnancyProgress(): string {
    return this.translation.translateParams('symptomsTracker.pregnancyProgress', {
      weeks: 12,
      days: 3,
      dayLabel: this.translation.translate('symptomsTracker.dayPlural'),
    });
  }

  /**
   * Get day progress percentage
   */
  getDayProgress(): number {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const total = endOfDay.getTime() - startOfDay.getTime();
    const elapsed = now.getTime() - startOfDay.getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }

  /**
   * Top-level mood chips (great / good / …)
   */
  getMoodOptions(): { id: string; emoji: string }[] {
    return [
      { id: 'great', emoji: '😊' },
      { id: 'good', emoji: '🙂' },
      { id: 'okay', emoji: '😐' },
      { id: 'not_great', emoji: '😔' },
      { id: 'terrible', emoji: '😢' },
    ];
  }

  symptomLabel(id: string): string {
    return this.translation.translate(`symptoms.option.${id}`);
  }

  /**
   * Get current mood name
   */
  getCurrentMoodName(currentMood: string): string {
    return this.symptomLabel(currentMood);
  }

  /**
   * Get symptom name
   */
  getSymptomName(symptom: string): string {
    return this.symptomLabel(symptom);
  }

  /**
   * Get symptom icon
   */
  getSymptomIcon(symptom: string): string {
    const symptomIcons: { [key: string]: string } = {
      fatigue: 'bed-outline',
      nausea: 'medical-outline',
      headache: 'headset-outline',
      cramps: 'heart-outline',
    };
    return symptomIcons[symptom] || 'medical-outline';
  }

  /**
   * Get mood emoji
   */
  getMoodEmoji(mood: string): string {
    const moodEmojis: { [key: string]: string } = {
      great: '😊',
      good: '🙂',
      okay: '😐',
      not_great: '😔',
      terrible: '😢',
    };
    return moodEmojis[mood] || '🙂';
  }

  /**
   * Get energy emoji
   */
  getEnergyEmoji(energy: string): string {
    const energyEmojis: { [key: string]: string } = {
      high: '⚡',
      medium: '🔋',
      low: '🪫',
    };
    return energyEmojis[energy] || '🔋';
  }

  /**
   * Format date for input
   */
  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Get local date string
   */
  getLocalDateString(): string {
    const today = new Date();
    return this.formatDateForInput(today);
  }

  /**
   * Get current pregnancy week (placeholder)
   */
  getCurrentPregnancyWeek(): number {
    return 12;
  }
}
