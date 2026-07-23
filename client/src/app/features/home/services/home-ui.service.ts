import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HomeUIService {

  constructor() {}

  /**
   * Get greeting message based on time of day
   */
  getGreetingMessage(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  /**
   * Get status icon based on user status
   */
  getStatusIcon(
    userStatus: string,
    isPregnant: boolean,
    isPostpartum: boolean,
    isMenopause = false,
  ): string {
    if (isPregnant) return 'heart';
    if (isMenopause || userStatus === 'Menopause') return 'moon-outline';
    if (isPostpartum) return 'flower';
    if (userStatus === 'Trying to Conceive') return 'rose';
    return 'person-circle';
  }

  /**
   * Get status title
   */
  getStatusTitle(userStatus: string, isPregnant: boolean, isPostpartum: boolean): string {
    if (isPregnant) return 'Pregnancy Journey';
    if (isPostpartum) return 'Postpartum Recovery';
    return userStatus;
  }

  /**
   * Get status description
   */
  getStatusDescription(userStatus: string, isPregnant: boolean, isPostpartum: boolean, pregnancyWeek: number): string {
    if (isPregnant) return `Week ${pregnancyWeek} of your beautiful journey`;
    if (isPostpartum) return 'Taking care of yourself and your little one';
    if (userStatus === 'Trying to Conceive') return 'Every day brings new possibilities';
    return 'Set your status to get personalized insights';
  }

  /**
   * Get progress label
   */
  getProgressLabel(isPregnant: boolean, isPostpartum: boolean): string {
    if (isPregnant) return 'Pregnancy Progress';
    if (isPostpartum) return 'Recovery Progress';
    return 'Cycle Progress';
  }

  /**
   * Get progress value
   */
  getProgressValue(isPregnant: boolean, pregnancyWeek: number, currentCycleDay: number): string {
    if (isPregnant) return `Week ${pregnancyWeek}`;
    return `Day ${currentCycleDay}`;
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(isPregnant: boolean, pregnancyProgress: number, currentCycleDay: number): number {
    if (isPregnant) return pregnancyProgress;
    return Math.min(100, (currentCycleDay / 28) * 100);
  }

  /**
   * Get status indicator CSS class
   */
  getStatusIndicatorClass(isPregnant: boolean, isPostpartum: boolean): string {
    if (isPregnant) return 'pregnant';
    if (isPostpartum) return 'postpartum';
    return 'ttc';
  }

  /**
   * Get status icon CSS class
   */
  getStatusIconClass(isPregnant: boolean, isPostpartum: boolean): string {
    if (isPregnant) return 'pregnant-icon';
    if (isPostpartum) return 'postpartum-icon';
    return 'ttc-icon';
  }

  /**
   * Get trimester information
   */
  getTrimester(pregnancyWeek: number): string {
    if (pregnancyWeek <= 12) return 'First Trimester';
    if (pregnancyWeek <= 26) return 'Second Trimester';
    return 'Third Trimester';
  }

  /**
   * Get milestone text
   */
  getMilestone(pregnancyWeek: number): string {
    if (pregnancyWeek <= 4) return 'Early Development';
    if (pregnancyWeek <= 8) return 'Embryonic Stage';
    if (pregnancyWeek <= 12) return 'End of First Trimester';
    if (pregnancyWeek <= 20) return 'Anatomy Scan Time';
    if (pregnancyWeek <= 28) return 'Viability Milestone';
    if (pregnancyWeek <= 36) return 'Almost There!';
    return 'Full Term';
  }

  /**
   * Get days remaining until due date
   */
  getDaysRemaining(pregnancyWeek: number): number {
    const totalWeeks = 40;
    const remainingWeeks = totalWeeks - pregnancyWeek;
    return Math.max(0, remainingWeeks * 7);
  }

  /**
   * Get formatted due date
   */
  getDueDate(pregnancyWeek: number): string {
    const today = new Date();
    const daysToAdd = this.getDaysRemaining(pregnancyWeek);
    const dueDate = new Date(today.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
    return dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  /**
   * Get progress circumference for SVG circle
   */
  getProgressCircumference(): string {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    return `${circumference} ${circumference}`;
  }

  /**
   * Get progress offset for SVG circle
   */
  getProgressOffset(pregnancyProgress: number): string {
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (pregnancyProgress / 100) * circumference;
    return `${offset}`;
  }

  /**
   * Get cycle day status
   */
  getCycleDayStatus(currentCycleDay: number): string {
    if (currentCycleDay <= 5) return 'Menstrual Phase';
    if (currentCycleDay <= 13) return 'Follicular Phase';
    if (currentCycleDay <= 15) return 'Ovulation Phase';
    return 'Luteal Phase';
  }

  /**
   * Get cycle day description
   */
  getCycleDayDescription(currentCycleDay: number): string {
    if (currentCycleDay <= 5) return 'Rest and self-care are important';
    if (currentCycleDay <= 13) return 'Your body is preparing for ovulation';
    if (currentCycleDay <= 15) return 'Peak fertility window - perfect timing!';
    return 'Watch for early pregnancy signs';
  }

  /**
   * Get baby length based on pregnancy week
   */
  getBabyLength(pregnancyWeek: number): string {
    const lengths: { [key: number]: string } = {
      4: '2mm', 5: '3mm', 6: '4mm', 7: '10mm', 8: '16mm',
      9: '23mm', 10: '31mm', 11: '41mm', 12: '54mm', 13: '74mm',
      14: '87mm', 15: '104mm', 16: '116mm', 17: '130mm', 18: '144mm',
      19: '154mm', 20: '166mm', 21: '267mm', 22: '280mm', 23: '300mm',
      24: '300mm', 25: '346mm', 26: '350mm', 27: '370mm', 28: '380mm',
      29: '390mm', 30: '400mm', 31: '410mm', 32: '430mm', 33: '440mm',
      34: '450mm', 35: '460mm', 36: '470mm', 37: '480mm', 38: '490mm',
      39: '500mm', 40: '510mm'
    };
    return lengths[pregnancyWeek] || '50mm';
  }
}
