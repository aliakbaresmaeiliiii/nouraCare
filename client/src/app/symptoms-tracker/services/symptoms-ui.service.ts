import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SymptomsUIService {

  constructor() {}

  /**
   * Get formatted date for display
   */
  getFormattedDate(selectedDate: string): string {
    const date = new Date(selectedDate);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  /**
   * Get pregnancy progress text
   */
  getPregnancyProgress(): string {
    // This would be calculated based on user's pregnancy data
    return "Week 12 • Day 3";
  }

  /**
   * Get day progress percentage
   */
  getDayProgress(): number {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const total = endOfDay.getTime() - startOfDay.getTime();
    const elapsed = now.getTime() - startOfDay.getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }

  /**
   * Get mood options for UI
   */
  getMoodOptions(): any[] {
    return [
      { id: 'great', name: 'Great', emoji: '😊' },
      { id: 'good', name: 'Good', emoji: '🙂' },
      { id: 'okay', name: 'Okay', emoji: '😐' },
      { id: 'not_great', name: 'Not Great', emoji: '😔' },
      { id: 'terrible', name: 'Terrible', emoji: '😢' }
    ];
  }

  /**
   * Get current mood name
   */
  getCurrentMoodName(currentMood: string): string {
    const mood = this.getMoodOptions().find(m => m.id === currentMood);
    return mood?.name || '';
  }

  /**
   * Get symptom name
   */
  getSymptomName(symptom: string): string {
    const symptomNames: { [key: string]: string } = {
      'fatigue': 'Fatigue',
      'nausea': 'Nausea',
      'headache': 'Headache',
      'cramps': 'Cramps'
    };
    return symptomNames[symptom] || symptom;
  }

  /**
   * Get symptom icon
   */
  getSymptomIcon(symptom: string): string {
    const symptomIcons: { [key: string]: string } = {
      'fatigue': 'bed-outline',
      'nausea': 'medical-outline',
      'headache': 'headset-outline',
      'cramps': 'heart-outline'
    };
    return symptomIcons[symptom] || 'medical-outline';
  }

  /**
   * Get mood emoji
   */
  getMoodEmoji(mood: string): string {
    const moodEmojis: { [key: string]: string } = {
      'great': '😊',
      'good': '🙂',
      'okay': '😐',
      'not_great': '😔',
      'terrible': '😢'
    };
    return moodEmojis[mood] || '🙂';
  }

  /**
   * Get energy emoji
   */
  getEnergyEmoji(energy: string): string {
    const energyEmojis: { [key: string]: string } = {
      'high': '⚡',
      'medium': '🔋',
      'low': '🪫'
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
    // This would be calculated based on user's pregnancy data
    return 12;
  }
}
