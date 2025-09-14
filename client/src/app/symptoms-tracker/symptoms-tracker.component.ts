import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { SharedModule } from '../shared/shared-module';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { TrackDay } from './track-day';

interface SymptomData {
  id: string;
  name: string;
  category: string;
  icon: string;
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
  timestamp: Date;
}

interface DailySymptoms {
  date: string;
  mood: 'excellent' | 'good' | 'okay' | 'poor' | 'terrible';
  energy: 'high' | 'medium' | 'low';
  symptoms: SymptomData[];
  notes: string;
}

@Component({
  selector: 'app-symptoms-tracker',
  templateUrl: './symptoms-tracker.component.html',
  styleUrls: ['./symptoms-tracker.component.scss'],
  standalone: true,
  imports: [SharedModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SymptomsTrackerComponent implements OnInit {
  private navCtrl = inject(NavController);
  private route = inject(ActivatedRoute);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private trackService = inject(TrackDay);

  selectedDate: string = new Date().toISOString().split('T')[0];
  maxDate: string = new Date().toISOString();
  currentMood: string = 'good';
  currentEnergy: string = 'medium';
  selectedSymptoms: SymptomData[] = [];
  notes: string = '';
  activeTab: string = 'today';

  // Reactive Form
  symptomsForm!: FormGroup;

  // Available symptoms based on pregnancy stage
  availableSymptoms = [
    // First Trimester Symptoms
    { id: 'morning_sickness', name: 'Morning Sickness', category: 'Digestive', icon: 'restaurant-outline', trimester: [1, 2, 3] },
    { id: 'fatigue', name: 'Fatigue', category: 'General', icon: 'bed-outline', trimester: [1, 2, 3] },
    { id: 'breast_tenderness', name: 'Breast Tenderness', category: 'Physical', icon: 'heart-outline', trimester: [1, 2] },
    { id: 'frequent_urination', name: 'Frequent Urination', category: 'Physical', icon: 'water-outline', trimester: [1, 2, 3] },
    { id: 'food_aversions', name: 'Food Aversions', category: 'Digestive', icon: 'close-circle-outline', trimester: [1, 2] },
    { id: 'mood_swings', name: 'Mood Swings', category: 'Emotional', icon: 'happy-outline', trimester: [1, 2, 3] },

    // Second Trimester Symptoms
    { id: 'back_pain', name: 'Back Pain', category: 'Physical', icon: 'medical-outline', trimester: [2, 3] },
    { id: 'leg_cramps', name: 'Leg Cramps', category: 'Physical', icon: 'fitness-outline', trimester: [2, 3] },
    { id: 'heartburn', name: 'Heartburn', category: 'Digestive', icon: 'flame-outline', trimester: [2, 3] },
    { id: 'nasal_congestion', name: 'Nasal Congestion', category: 'Physical', icon: 'airplane-outline', trimester: [2, 3] },
    { id: 'baby_movements', name: 'Baby Movements', category: 'Physical', icon: 'hand-left-outline', trimester: [2, 3] },

    // Third Trimester Symptoms
    { id: 'shortness_breath', name: 'Shortness of Breath', category: 'Physical', icon: 'airplane-outline', trimester: [3] },
    { id: 'swelling', name: 'Swelling (Edema)', category: 'Physical', icon: 'water-outline', trimester: [3] },
    { id: 'braxton_hicks', name: 'Braxton Hicks', category: 'Physical', icon: 'pulse-outline', trimester: [3] },
    { id: 'sleep_difficulties', name: 'Sleep Difficulties', category: 'General', icon: 'moon-outline', trimester: [3] },
    { id: 'nesting_instinct', name: 'Nesting Instinct', category: 'Emotional', icon: 'home-outline', trimester: [3] },

    // General Symptoms
    { id: 'headache', name: 'Headache', category: 'Physical', icon: 'medical-outline', trimester: [1, 2, 3] },
    { id: 'dizziness', name: 'Dizziness', category: 'Physical', icon: 'refresh-outline', trimester: [1, 2, 3] },
    { id: 'constipation', name: 'Constipation', category: 'Digestive', icon: 'restaurant-outline', trimester: [1, 2, 3] },
    { id: 'anxiety', name: 'Anxiety', category: 'Emotional', icon: 'heart-outline', trimester: [1, 2, 3] },
    { id: 'cravings', name: 'Food Cravings', category: 'Digestive', icon: 'restaurant-outline', trimester: [1, 2, 3] }
  ];

  // Historical data (in real app, this would come from a service/database)
  dailySymptomsHistory: DailySymptoms[] = [];

  ngOnInit() {
    this.initializeForm();
    this.route.queryParams.subscribe(params => {
      if (params['date']) {
        this.selectedDate = params['date'];
      }
    });
    this.loadTodayData();
  }

  initializeForm() {
    this.symptomsForm = this.fb.group({
      date: [this.selectedDate, Validators.required],
      mood: ['good', Validators.required],
      energy: ['medium', Validators.required],
      symptoms: this.fb.array([]),
      notes: [''],
      pregnancyWeek: [this.getCurrentPregnancyWeek()]
    });
  }

  onDateChange(event: any) {
    this.selectedDate = event.detail.value;
    this.symptomsForm.patchValue({ date: this.selectedDate });
    this.symptomsForm.get('date')?.markAsTouched();
    this.loadTodayData();
  }

  onNotesChange(event: any) {
    this.notes = event.detail.value;
    this.symptomsForm.patchValue({ notes: this.notes });
    this.symptomsForm.get('notes')?.markAsTouched();
  }

  onMoodChange(mood: string) {
    this.currentMood = mood;
    this.symptomsForm.patchValue({ mood: mood });
    this.symptomsForm.get('mood')?.markAsTouched();
  }

  onEnergyChange(energy: string) {
    this.currentEnergy = energy;
    this.symptomsForm.patchValue({ energy: energy });
    this.symptomsForm.get('energy')?.markAsTouched();
  }

  loadTodayData() {
    // Load existing data for today if available
    const todayData = this.dailySymptomsHistory.find(d => d.date === this.selectedDate);
    if (todayData) {
      // Parse JSON strings if they exist
      this.currentMood = typeof todayData.mood === 'string' 
        ? JSON.parse(todayData.mood) 
        : todayData.mood;
      this.currentEnergy = typeof todayData.energy === 'string' 
        ? JSON.parse(todayData.energy) 
        : todayData.energy;
      this.selectedSymptoms = typeof todayData.symptoms === 'string' 
        ? JSON.parse(todayData.symptoms) 
        : (todayData.symptoms || []);
      this.notes = todayData.notes || '';
    } else {
      this.resetForm();
    }
  }

  resetForm() {
    this.currentMood = 'good';
    this.currentEnergy = 'medium';
    this.selectedSymptoms = [];
    this.notes = '';
  }

  setActiveTab(tab: any) {
    this.activeTab = tab.detail.value;
  }

  toggleSymptom(symptom: any) {
    const existingIndex = this.selectedSymptoms.findIndex(s => s.id === symptom.id);

    if (existingIndex >= 0) {
      // Remove symptom
      this.selectedSymptoms.splice(existingIndex, 1);
    } else {
      // Add symptom
      const newSymptom: SymptomData = {
        id: symptom.id,
        name: symptom.name,
        category: symptom.category,
        icon: symptom.icon,
        severity: 'mild',
        timestamp: new Date()
      };
      this.selectedSymptoms.push(newSymptom);
    }

    // Update form array
    this.updateSymptomsFormArray();
  }

  updateSymptomsFormArray() {
    const symptomsArray = this.symptomsForm.get('symptoms') as FormArray;
    symptomsArray.clear();

    this.selectedSymptoms.forEach(symptom => {
      symptomsArray.push(this.fb.group({
        id: [symptom.id],
        name: [symptom.name],
        category: [symptom.category],
        icon: [symptom.icon],
        severity: [symptom.severity],
        notes: [symptom.notes || ''],
        timestamp: [symptom.timestamp]
      }));
    });
  }

  isSymptomSelected(symptomId: string): boolean {
    return this.selectedSymptoms.some(s => s.id === symptomId);
  }

  async updateSymptomSeverity(symptom: SymptomData) {
    const alert = await this.alertController.create({
      header: 'Symptom Severity',
      message: `How severe is your ${symptom.name.toLowerCase()}?`,
      inputs: [
        {
          name: 'severity',
          type: 'radio',
          label: 'Mild',
          value: 'mild',
          checked: symptom.severity === 'mild'
        },
        {
          name: 'severity',
          type: 'radio',
          label: 'Moderate',
          value: 'moderate',
          checked: symptom.severity === 'moderate'
        },
        {
          name: 'severity',
          type: 'radio',
          label: 'Severe',
          value: 'severe',
          checked: symptom.severity === 'severe'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Update',
          handler: (data) => {
            if (data) {
              symptom.severity = data;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async addSymptomNote(symptom: SymptomData) {
    const alert = await this.alertController.create({
      header: 'Add Note',
      message: `Add a note about your ${symptom.name.toLowerCase()}:`,
      inputs: [
        {
          name: 'note',
          type: 'textarea',
          placeholder: 'Describe your symptoms...',
          value: symptom.notes || ''
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: (data) => {
            if (data.note) {
              symptom.notes = data.note;
            }
          }
        }
      ]
    });

    await alert.present();
  }

  removeSymptom(symptomId: string) {
    this.selectedSymptoms = this.selectedSymptoms.filter(s => s.id !== symptomId);
  }

  async saveSymptoms() {
    try {
      // Update form with current values
      this.symptomsForm.patchValue({
        date: this.selectedDate,
        mood: this.currentMood,
        energy: this.currentEnergy,
        notes: this.notes,
        pregnancyWeek: this.getCurrentPregnancyWeek()
      });

      // Validate form
      if (this.symptomsForm.invalid) {
        await this.showToast('Please fill in all required fields', 'warning');
        return;
      }

      // Prepare API data
      const formData = this.symptomsForm.value;
      const apiData = {
        ...formData,
        userId: this.getUserId(), // Get from localStorage or auth service
        timestamp: new Date().toISOString()
      };

      // Send to API
      await this.sendSymptomsToAPI(apiData);

      // Update local history with API-compatible format
      const dailyData: DailySymptoms = {
        date: this.selectedDate,
        mood: this.currentMood as any,
        energy: this.currentEnergy as any,
        symptoms: [...this.selectedSymptoms],
        notes: this.notes
      };

      // Convert to API format (JSON strings for symptoms, mood, energy)
      const apiFormattedData = {
        ...dailyData,
        symptoms: JSON.stringify(dailyData.symptoms),
        mood: JSON.stringify(dailyData.mood),
        energy: JSON.stringify(dailyData.energy)
      };

      const existingIndex = this.dailySymptomsHistory.findIndex(d => d.date === this.selectedDate);
      if (existingIndex >= 0) {
        this.dailySymptomsHistory[existingIndex] = apiFormattedData as unknown as DailySymptoms;
      } else {  
        this.dailySymptomsHistory.push(apiFormattedData as unknown as DailySymptoms);
      }

      // Show success message
      await this.showToast('✅ Symptoms saved successfully!', 'success');

      // Show summary of what was saved
      // await this.showSaveSummary(dailyData);

      // Refresh home page data
      this.refreshHomePageData();

      // Navigate back to home
      this.navCtrl.back();

    } catch (error) {
      console.error('Error saving symptoms:', error);
      await this.showToast('❌ Failed to save symptoms. Please try again.', 'danger');
    }
  }

  sendSymptomsToAPI(data: any) {
    try {
      this.trackService.createSymptoms(this.getUserId(), data).subscribe((response) => {

      });

    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  getUserId(): string {
    try {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const parsed = JSON.parse(userInfo);
        return parsed.user?.id || parsed.id || 'anonymous';
      }
    } catch (error) {
      console.error('Error getting user ID:', error);
    }
    return 'anonymous';
  }

  refreshHomePageData() {
    // Trigger a custom event to refresh home page data
    window.dispatchEvent(new CustomEvent('symptomsUpdated'));
  }

  async showSaveSummary(data: DailySymptoms) {
    const alert = await this.alertController.create({
      header: '📝 Symptoms Saved!',
      message: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
          <p><strong>Mood:</strong> ${this.getMoodEmoji(data.mood)} ${data.mood}</p>
          <p><strong>Energy:</strong> ${this.getEnergyEmoji(data.energy)} ${data.energy}</p>
          <p><strong>Symptoms:</strong> ${data.symptoms.length} tracked</p>
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ''}
        </div>
      `,
      buttons: [
        {
          text: 'View History',
          handler: () => {
            this.activeTab = 'history';
          }
        },
        {
          text: 'Continue Tracking',
          handler: () => {
            // Stay on the page to continue tracking
          }
        },
        {
          text: 'Done',
          handler: () => {
            this.navCtrl.back();
          }
        }
      ]
    });

    await alert.present();
  }

  getSymptomsByCategory(category: string) {
    return this.availableSymptoms.filter(s => s.category === category);
  }

  getSeverityColor(severity: string): string {
    switch (severity) {
      case 'mild': return 'success';
      case 'moderate': return 'warning';
      case 'severe': return 'danger';
      default: return 'medium';
    }
  }

  getMoodEmoji(mood: string): string {
    const moodEmojis: Record<string, string> = {
      'excellent': '😄',
      'good': '😊',
      'okay': '😐',
      'poor': '😔',
      'terrible': '😢'
    };
    return moodEmojis[mood] || '😐';
  }

  getEnergyEmoji(energy: string): string {
    const energyEmojis: Record<string, string> = {
      'high': '⚡',
      'medium': '🔋',
      'low': '🔋'
    };
    return energyEmojis[energy] || '🔋';
  }

  goBack() {
    this.navCtrl.back();
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color
    });
    await toast.present();
  }

  // Get current pregnancy week (you might want to inject a service for this)
  getCurrentPregnancyWeek(): number {
    // This should come from your pregnancy tracking service
    return 20; // Example value
  }

  getRelevantSymptoms() {
    const currentWeek = this.getCurrentPregnancyWeek();
    const trimester = currentWeek <= 12 ? 1 : currentWeek <= 28 ? 2 : 3;
    return this.availableSymptoms.filter(s => s.trimester.includes(trimester));
  }
}
