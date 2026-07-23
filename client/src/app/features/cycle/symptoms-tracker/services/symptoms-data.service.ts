import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TrackDataService } from '@app/shared/services/track-data.service';
import { SymptomData, SYMPTOMS_CONFIG } from '@app/shared/constants/symptoms-config';

export interface SymptomsLoadResult {
  currentMood: string;
  currentEnergy: string;
  notes: string;
  selectedItems: Set<string>;
  quickSymptoms: Set<string>;
  selectedSymptoms: SymptomData[];
  hasDataForDate: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class SymptomsDataService {

  constructor(private trackDataService: TrackDataService) {}

  /**
   * Load symptoms data from API
   */
  loadFromAPI(apiData: any): SymptomsLoadResult {
    const result: SymptomsLoadResult = {
      currentMood: apiData.mood || 'good',
      currentEnergy: apiData.energy || 'medium',
      notes: apiData.notes || '',
      selectedItems: new Set<string>(),
      quickSymptoms: new Set<string>(),
      selectedSymptoms: [],
      hasDataForDate: true
    };

    // Handle symptoms from API - they come as objects with id, name, category, etc.
    const symptomsFromAPI = apiData.symptoms || [];
    
    symptomsFromAPI.forEach((symptom: any) => {
      if (symptom && symptom.id) {
        const symptomId = symptom.id;
        
        // Add to selectedItems for UI selection state
        result.selectedItems.add(symptomId);
        
        // Add to selectedSymptoms for form data
        result.selectedSymptoms.push(symptom);
        
        // Check if it's a quick symptom and add to quickSymptoms
        if (['fatigue', 'nausea', 'headache', 'cramps'].includes(symptomId)) {
          result.quickSymptoms.add(symptomId);
        }
      }
    });

    return result;
  }

  /**
   * Load symptoms data from local service
   */
  loadFromLocalService(existingData: any): SymptomsLoadResult {
    const result: SymptomsLoadResult = {
      currentMood: existingData.mood || 'good',
      currentEnergy: existingData.energy || 'medium',
      notes: existingData.notes || '',
      selectedItems: new Set<string>(),
      quickSymptoms: new Set<string>(),
      selectedSymptoms: [],
      hasDataForDate: true
    };

    // Handle symptoms - TrackDataService stores them as array
    const symptomsToLoad = existingData.symptoms || [];
    
    symptomsToLoad.forEach((symptom: any) => {
      const symptomId = typeof symptom === 'string' ? symptom : (symptom.id || symptom.name || symptom);
      result.selectedItems.add(symptomId);
      
      // Check if it's a quick symptom
      if (['fatigue', 'nausea', 'headache', 'cramps'].includes(symptomId)) {
        result.quickSymptoms.add(symptomId);
      }
    });

    return result;
  }

  /**
   * Convert selected items to symptoms array
   */
  convertSelectedItemsToSymptoms(selectedItems: Set<string>): SymptomData[] {
    const allOptions = [
      ...SYMPTOMS_CONFIG.sexDriveOptions,
      ...SYMPTOMS_CONFIG.moodOptions,
      ...SYMPTOMS_CONFIG.physicalSymptoms
    ];
    const nowIso = new Date().toISOString();

    const symptoms = Array.from(selectedItems).map(itemId => {
      const option = allOptions.find(opt => opt.id === itemId);
      if (option) {
        return {
          id: option.id,
          name: option.name,
          icon: option.icon,
          category: this.getCategoryForItem(itemId),
          severity: 'mild' as const,
          timestamp: new Date(nowIso),
        };
      }
      return null;
    }).filter(symptom => symptom !== null) as SymptomData[];

    return symptoms;
  }

  /**
   * Get category for a symptom item
   */
  private getCategoryForItem(itemId: string): string {
    if (SYMPTOMS_CONFIG.sexDriveOptions.find(opt => opt.id === itemId)) {
      return 'Sex and Sex Drive';
    }
    if (SYMPTOMS_CONFIG.moodOptions.find(opt => opt.id === itemId)) {
      return 'Mood';
    }
    if (SYMPTOMS_CONFIG.physicalSymptoms.find(opt => opt.id === itemId)) {
      return 'Physical Symptoms';
    }
    return 'Other';
  }

  /**
   * Create API data payload
   */
  createApiPayload(data: {
    userId: string;
    selectedItems: Set<string>;
    quickSymptoms: Set<string>;
    currentMood: string;
    currentEnergy: string;
    notes: string;
    selectedDate: string;
  }) {
    const nowIso = new Date().toISOString();

    // Convert selected chips to symptoms array (API expects ISO timestamp strings)
    const selectedSymptoms = this.convertSelectedItemsToSymptoms(
      data.selectedItems,
    ).map((s) => ({
      id: s.id,
      name: s.name,
      icon: s.icon,
      category: s.category,
      severity: s.severity,
      timestamp: nowIso,
    }));

    // Add quick symptoms to the list
    const quickSymptomsArray = Array.from(data.quickSymptoms).map((symptom) => ({
      id: symptom,
      name: this.getSymptomName(symptom),
      icon: this.getSymptomIcon(symptom),
      category: 'Quick',
      severity: 'mild',
      timestamp: nowIso,
    }));

    // Combine all symptoms — only fields allowed by CreateTrackDayDto / UpdateTrackDayDto
    const allSymptoms = [...selectedSymptoms, ...quickSymptomsArray];

    return {
      date: data.selectedDate,
      mood: data.currentMood,
      energy: data.currentEnergy,
      notes: data.notes,
      symptoms: allSymptoms,
    };
  }

  /**
   * Get symptom name
   */
  private getSymptomName(symptom: string): string {
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
  private getSymptomIcon(symptom: string): string {
    const symptomIcons: { [key: string]: string } = {
      'fatigue': 'bed-outline',
      'nausea': 'medical-outline',
      'headache': 'headset-outline',
      'cramps': 'heart-outline'
    };
    return symptomIcons[symptom] || 'medical-outline';
  }

  /**
   * Get track data by date
   */
  getTrackDataByDate(date: string) {
    return this.trackDataService.getTrackDataByDate(date);
  }

  /**
   * Get track data from API
   */
  getTrackDayFromAPI(userId: number, date: string): Observable<any> {
    return this.trackDataService.getTrackDay(userId, date);
  }

  /**
   * Create symptoms in API
   */
  createSymptomsInAPI(userId: string, data: any): Observable<any> {
    return this.trackDataService.createSymptoms(userId, data);
  }

  /**
   * Update symptoms in API
   */
  updateSymptomsInAPI(userId: string, date: string, data: any): Observable<any> {
    return this.trackDataService.updateSymptoms(userId, date, data);
  }

  /**
   * Save to local service
   */
  saveToLocalService(data: any) {
    this.trackDataService.saveTrackData(data);
  }
}
