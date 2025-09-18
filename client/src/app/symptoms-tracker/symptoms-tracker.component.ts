import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { SharedModule } from '../shared/shared-module';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TrackDataService } from '../shared/services/track-data.service';
import { DailySymptoms, SymptomData, SYMPTOMS_CONFIG } from '../shared/constants/symptoms-config';



@Component({
  selector: 'app-symptoms-tracker',
  templateUrl: './symptoms-tracker-simple.html',
  styleUrls: ['./symptoms-tracker-simple.scss'],
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
  private trackDataService = inject(TrackDataService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  selectedDate: string = this.getLocalDateString();

  maxDate: string = new Date().toISOString();
  currentMood: string = 'good';
  currentEnergy: string = 'medium';
  selectedSymptoms: SymptomData[] = [];
  notes: string = '';
  selectedItems: Set<string> = new Set();
  isUpdateMode: boolean = false;
  existingData: any;

  // Use shared symptoms configuration
  sexDriveOptions = SYMPTOMS_CONFIG.sexDriveOptions;
  moodOptions = SYMPTOMS_CONFIG.moodOptions;
  physicalSymptoms = SYMPTOMS_CONFIG.physicalSymptoms;
  availableSymptoms = SYMPTOMS_CONFIG.availableSymptoms;

  activeTab: string = 'today';

  // Reactive Form
  symptomsForm!: FormGroup;

  // New UI state properties
  categoriesExpanded = {
    physical: true,
    mood: false,
    intimacy: false
  };
  
  allCategoriesExpanded = false;
  quickSymptoms = new Set<string>();



  // Historical data (in real app, this would come from a service/database)
  dailySymptomsHistory: DailySymptoms[] = [];

  ngOnInit() {
    this.initializeForm();
    this.route.queryParams.subscribe(params => {
      if (params['date']) {
        // Ensure date is in local format (YYYY-MM-DD)
        const dateParam = params['date'];
        const date = new Date(dateParam);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        this.selectedDate = `${year}-${month}-${day}`;
      }
      if (params['mode'] === 'update') {
        this.isUpdateMode = true;
        this.loadExistingData();
      } else {
        this.loadTodayData();
      }
    });
  }

  // New methods for chip-based design
  isSelected(itemId: string): boolean {
    return this.selectedItems.has(itemId);
  }

  toggleSelection(itemId: string): void {
    if (this.selectedItems.has(itemId)) {
      this.selectedItems.delete(itemId);
    } else {
      this.selectedItems.add(itemId);
    }
  }

  convertSelectedItemsToSymptoms(): any[] {
    const allOptions = [
      ...this.sexDriveOptions,
      ...this.moodOptions,
      ...this.physicalSymptoms
    ];

    const symptoms = Array.from(this.selectedItems).map(itemId => {
      const option = allOptions.find(opt => opt.id === itemId);
      console.log(`🔍 Processing itemId: ${itemId}, found option:`, option);
      if (option) {
        return {
          id: option.id,
          name: option.name,
          icon: option.icon,
          category: this.getCategoryForItem(itemId),
          severity: 'mild' // Default severity
        };
      }
      return null;
    }).filter(symptom => symptom !== null);

    console.log('🔍 Final symptoms array:', symptoms);
    return symptoms;
  }

  getCategoryForItem(itemId: string): string {
    if (this.sexDriveOptions.find(opt => opt.id === itemId)) {
      return 'Sex and Sex Drive';
    } else if (this.moodOptions.find(opt => opt.id === itemId)) {
      return 'Mood';
    } else if (this.physicalSymptoms.find(opt => opt.id === itemId)) {
      return 'Physical Symptoms';
    }
    return 'General';
  }

  getPregnancyProgress(): string {
    // Calculate pregnancy progress based on stored data
    const lastPeriod = localStorage.getItem('lastPeriodDate');
    if (lastPeriod) {
      const lastPeriodDate = new Date(lastPeriod);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastPeriodDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const weeks = Math.floor(diffDays / 7);
      const days = diffDays % 7;
      return `${weeks} weeks, ${days} day${days !== 1 ? 's' : ''}`;
    }
    return '2 weeks, 1 day'; // Default fallback
  }

  goBack(): void {
    this.router.navigate(['/tabs/home']);
  }

  loadExistingData(): void {
    const userId = this.getCurrentUserId();

      this.trackDataService.getTrackDay(userId, this.selectedDate).subscribe({
        next: (data) => {
          this.existingData = data;
          this.populateFormWithExistingData();
        },
      error: (error) => {
        console.error('Error loading existing data:', error);
        this.showToast(`Failed to load existing data: ${error.message}`, 'danger', { duration: 3000 });
      }
    });
  }

  populateFormWithExistingData(): void {
    if (this.existingData) {
      // Set form values directly from API data
      this.currentMood = this.existingData.mood;
      this.currentEnergy = this.existingData.energy;
      this.notes = this.existingData.notes || '';

      // Clear and populate selected items
      this.selectedItems.clear();
      this.selectedSymptoms = [];
      // Add mood and energy to selectedItems
      this.selectedItems.add(this.existingData.mood);
      this.selectedItems.add(this.existingData.energy);

      // Add symptoms to selectedItems
      if (this.existingData.symptoms && Array.isArray(this.existingData.symptoms)) {
        this.existingData.symptoms.forEach((symptom: any) => {
          this.selectedItems.add(symptom.id);
          this.selectedSymptoms.push(symptom);
        });
      }

      // Update form
      this.symptomsForm.patchValue({
        date: this.selectedDate,
        mood: this.existingData.mood,
        energy: this.existingData.energy,
        notes: this.notes,
        symptoms: this.selectedSymptoms
      });

      // Update symptoms form array
      this.updateSymptomsFormArray();

      // Force change detection to update the UI
      this.cdr.detectChanges();
    }
  }

  getCurrentUserId(): number {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.user?.id || parsed.id || 30; // fallback to 30
    }
    return 30; // fallback
  }

  getLocalDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    // Ensure date is in local format (YYYY-MM-DD)
    const dateValue = event.detail.value;
    if (dateValue) {
      // Convert to local date format
      const date = new Date(dateValue);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      this.selectedDate = `${year}-${month}-${day}`;
    }
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
      this.isSelected(todayData.mood);
      this.isSelected(todayData.energy);
      this.isSelected(todayData.notes);
      this.isSelected(todayData.date);
      // Parse JSON strings if they exist
      this.currentMood = typeof todayData.mood === 'string'
        ? JSON.parse(todayData.mood)
        : todayData.mood;
      this.currentEnergy = typeof todayData.energy === 'string'
        ? JSON.parse(todayData.energy)
        : todayData.energy;
      this.isSelected(todayData.notes);
      this.isSelected(todayData.date);
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

      // Check if any symptoms are selected
      if (!this.hasAnySelection()) {
        await this.showToast('Please select at least one symptom to track', 'warning');
        return;
      }

      // Convert selected chips to symptoms array
      const selectedSymptoms = this.convertSelectedItemsToSymptoms();
      
      // Add quick symptoms to the list
      const quickSymptomsArray = Array.from(this.quickSymptoms).map(symptom => ({
        id: symptom,
        name: this.getSymptomName(symptom),
        icon: this.getSymptomIcon(symptom),
        category: 'Quick',
        severity: 'mild'
      }));

      // Combine all symptoms
      const allSymptoms = [...selectedSymptoms, ...quickSymptomsArray];

      const apiData = {
        userId: this.getUserId(),
        symptoms: allSymptoms,
        mood: this.currentMood,
        energy: this.currentEnergy,
        notes: this.notes,
        date: this.selectedDate,
        timestamp: new Date().toISOString()
      };


      if (this.isUpdateMode) {
        await this.updateSymptomsInAPI(apiData);
      } else {
        await this.sendSymptomsToAPI(apiData);
      }

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
      await this.showToast(`✅ ${allSymptoms.length} symptoms saved successfully!`, 'success');

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
      this.trackDataService.createSymptoms(this.getUserId(), data).subscribe((response) => {
        // Store in local service for quick access
        this.trackDataService.saveTrackData({
          id: response.id,
          userId: parseInt(this.getUserId()),
          date: data.date,
          symptoms: data.symptoms,
          mood: data.mood,
          energy: data.energy,
          notes: data.notes,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt
        });

        // Show success message
        this.showToast('Symptoms saved successfully!', 'success');

        // Navigate back
        this.goBack();
      });

    } catch (error) {
      console.error('API Error:', error);
      this.showToast('Failed to save symptoms', 'danger');
      throw error;
    }
  }

  updateSymptomsInAPI(data: any) {
    try {
      this.trackDataService.updateSymptoms(this.getUserId(), this.selectedDate, data).subscribe((response) => {
        console.log('Symptoms updated successfully:', response);

        // Update in local service
        this.trackDataService.saveTrackData({
          id: response.id,
          userId: parseInt(this.getUserId()),
          date: data.date,
          symptoms: data.symptoms,
          mood: data.mood,
          energy: data.energy,
          notes: data.notes,
          createdAt: response.createdAt,
          updatedAt: response.updatedAt
        });

        // Show success message
        this.showToast('Symptoms updated successfully!', 'success');

        // Navigate back
        this.goBack();
      });

    } catch (error) {
      console.error('Update API Error:', error);
      this.showToast('Failed to update symptoms', 'danger');
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

  // New modern UI methods
  getFormattedDate(): string {
    const date = new Date(this.selectedDate);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getDayProgress(): number {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
    const total = endOfDay.getTime() - startOfDay.getTime();
    const elapsed = now.getTime() - startOfDay.getTime();
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  }

  previousDay(): void {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() - 1);
    this.selectedDate = this.formatDateForInput(date);
    this.loadDayData();
  }

  nextDay(): void {
    const date = new Date(this.selectedDate);
    date.setDate(date.getDate() + 1);
    this.selectedDate = this.formatDateForInput(date);
    this.loadDayData();
  }

  openDatePicker(): void {
    // Implementation for date picker modal
    console.log('Open date picker');
  }

  selectMood(moodId: string): void {
    this.currentMood = moodId;
  }

  getMoodOptions(): any[] {
    return [
      { id: 'great', name: 'Great', emoji: '😊' },
      { id: 'good', name: 'Good', emoji: '🙂' },
      { id: 'okay', name: 'Okay', emoji: '😐' },
      { id: 'not_great', name: 'Not Great', emoji: '😔' },
      { id: 'terrible', name: 'Terrible', emoji: '😢' }
    ];
  }

  toggleQuickSymptom(symptom: string): void {
    if (this.quickSymptoms.has(symptom)) {
      this.quickSymptoms.delete(symptom);
    } else {
      this.quickSymptoms.add(symptom);
    }
  }

  isQuickSymptomSelected(symptom: string): boolean {
    return this.quickSymptoms.has(symptom);
  }

  toggleCategory(category: keyof typeof this.categoriesExpanded): void {
    this.categoriesExpanded[category] = !this.categoriesExpanded[category];
  }

  toggleAllCategories(): void {
    this.allCategoriesExpanded = !this.allCategoriesExpanded;
    Object.keys(this.categoriesExpanded).forEach(key => {
      this.categoriesExpanded[key as keyof typeof this.categoriesExpanded] = this.allCategoriesExpanded;
    });
  }

  getSelectedCount(category: string): number {
    let count = 0;
    switch (category) {
      case 'physical':
        count = this.physicalSymptoms.filter(s => this.isSelected(s.id)).length;
        break;
      case 'mood':
        count = this.moodOptions.filter(s => this.isSelected(s.id)).length;
        break;
      case 'intimacy':
        count = this.sexDriveOptions.filter(s => this.isSelected(s.id)).length;
        break;
    }
    return count;
  }

  hasAnySelection(): boolean {
    return this.selectedItems.size > 0 || this.quickSymptoms.size > 0;
  }

  getTotalSelections(): number {
    return this.selectedItems.size + this.quickSymptoms.size;
  }

  startVoiceInput(): void {
    // Implementation for voice input
    console.log('Start voice input');
  }

  viewHistory(): void {
    this.router.navigate(['/symptoms-history']);
  }

  private formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private loadDayData(): void {
    // Load data for the selected day
    console.log('Loading data for:', this.selectedDate);
  }

  getSymptomName(symptom: string): string {
    const symptomNames: { [key: string]: string } = {
      'fatigue': 'Fatigue',
      'nausea': 'Nausea',
      'headache': 'Headache',
      'cramps': 'Cramps'
    };
    return symptomNames[symptom] || symptom;
  }

  getSymptomIcon(symptom: string): string {
    const symptomIcons: { [key: string]: string } = {
      'fatigue': 'bed-outline',
      'nausea': 'medical-outline',
      'headache': 'headset-outline',
      'cramps': 'heart-outline'
    };
    return symptomIcons[symptom] || 'medical-outline';
  }

  getCurrentMoodName(): string {
    const mood = this.getMoodOptions().find(m => m.id === this.currentMood);
    return mood?.name || '';
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


  async showToast(message: string, color: string = 'primary', options: any = {}) {
    const toast = await this.toastController.create({
      message: message,
      duration: options.duration || 2000,
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


  // Method to manually test adding items
  testAddItems() {
    this.selectedItems.add('headache');
    this.selectedItems.add('fatigue');
    this.selectedItems.add('mood_swings');
    this.cdr.detectChanges();
  }

}
