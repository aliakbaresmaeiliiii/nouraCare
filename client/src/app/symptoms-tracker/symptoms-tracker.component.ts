import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { SharedModule } from '../shared/shared-module';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TrackDataService } from '../shared/services/track-data.service';
import { DailySymptoms, SymptomData, SYMPTOMS_CONFIG } from '../shared/constants/symptoms-config';
import { SymptomsDataService } from './services/symptoms-data.service';
import { SymptomsUIService } from './services/symptoms-ui.service';



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
  private symptomsDataService = inject(SymptomsDataService);
  private symptomsUIService = inject(SymptomsUIService);
  selectedDate: string = this.symptomsUIService.getLocalDateString();

  maxDate: string = new Date().toISOString();
  currentMood: string = 'good';
  currentEnergy: string = 'medium';
  selectedSymptoms: SymptomData[] = [];
  notes: string = '';
  selectedItems: Set<string> = new Set();
  isUpdateMode: boolean = false;
  existingData: any;
  hasDataForDate: boolean = false;

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
    return this.symptomsDataService.convertSelectedItemsToSymptoms(this.selectedItems);
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
    this.selectedItems.clear();
    this.quickSymptoms.clear();
    this.hasDataForDate = false;
    
    // Update form
    this.symptomsForm.patchValue({
      mood: this.currentMood,
      energy: this.currentEnergy,
      notes: this.notes
    });
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

   saveSymptoms() {
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
         this.showToast('Please select at least one symptom to track', 'warning');
        return;
      }

      // Convert selected chips to symptoms array
      const selectedSymptoms = this.convertSelectedItemsToSymptoms();
      
      const apiData = this.symptomsDataService.createApiPayload({
        userId: this.getUserId(),
        selectedItems: this.selectedItems,
        quickSymptoms: this.quickSymptoms,
        currentMood: this.currentMood,
        currentEnergy: this.currentEnergy,
        notes: this.notes,
        selectedDate: this.selectedDate
      });


      if (this.isUpdateMode) {
         this.updateSymptomsInAPI(apiData);
      } else {
         this.sendSymptomsToAPI(apiData);
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
       this.showToast(`✅ Symptoms saved successfully!`, 'success');

      // Show summary of what was saved
      // await this.showSaveSummary(dailyData);

      // Refresh home page data
      this.refreshHomePageData();

      // Navigate back to home
      this.navCtrl.back();

    } catch (error) {
      console.error('Error saving symptoms:', error);
       this.showToast('❌ Failed to save symptoms. Please try again.', 'danger');
    }
  }

  sendSymptomsToAPI(data: any) {
    try {
      this.trackDataService.createSymptoms(this.getUserId(), data).subscribe({
        next: (response) => {
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
          this.router.navigate(['/tabs/home'])
        },
        error: (error) => {
          console.error('API Error:', error);
          
          // Check if it's a 409 Conflict error (day already exists)
          if (error.status === 409 && error.error?.message?.includes('already exists')) {
            this.handleExistingDayConflict(data.date);
          } else {
            this.showToast('Failed to save symptoms', 'danger');
          }
        }
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
        this.router.navigate(['/tabs/home'])
      });

    } catch (error) {
      console.error('Update API Error:', error);
      this.showToast('Failed to update symptoms', 'danger');
      throw error;
    }
  }

  handleExistingDayConflict(date: string) {
    // Fetch existing data for this date
    this.trackDataService.getTrackDay(parseInt(this.getUserId()), date).subscribe({
      next: (existingData) => {
        if (existingData && existingData.length > 0) {
          // Show the existing data to the user
          this.showExistingDayAlert(existingData[0], date);
        } else {
          this.showToast('Day already exists but no data found', 'warning');
        }
      },
      error: (error) => {
        console.error('Error fetching existing day data:', error);
        this.showToast('Day already exists. Please try updating instead.', 'warning');
      }
    });
  }

  async showExistingDayAlert(existingData: any, date: string) {
    const alert = await this.alertController.create({
      header: 'Day Already Tracked',
      message: `You have already tracked symptoms for ${date}. Would you like to view or update the existing data?`,
      buttons: [
        {
          text: 'View Data',
          handler: () => {
            this.loadExistingDataFromAPI(existingData);
          }
        },
        {
          text: 'Update Data',
          handler: () => {
            this.loadExistingDataFromAPI(existingData);
            this.isUpdateMode = true;
          }
        },
        {
          text: 'Cancel',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  loadExistingDataFromAPI(existingData: any) {
    this.existingData = existingData;
    
    // Use service to load data
    const result = this.symptomsDataService.loadFromAPI(existingData);
    
    // Apply the result to component state
    this.currentMood = result.currentMood;
    this.currentEnergy = result.currentEnergy;
    this.notes = result.notes;
    this.selectedItems = result.selectedItems;
    this.quickSymptoms = result.quickSymptoms;
    this.selectedSymptoms = result.selectedSymptoms;
    this.hasDataForDate = result.hasDataForDate;
    
    // Set the form values
    this.symptomsForm.patchValue({
      mood: this.currentMood,
      energy: this.currentEnergy,
      notes: this.notes
    });

    this.showToast(`Data loaded for ${this.getFormattedDate()}`, 'success');
    this.cdr.detectChanges();
  }

  loadExistingDataFromService(existingData: any) {
    this.resetForm();
    
    if (existingData) {
      // Use service to load data
      const result = this.symptomsDataService.loadFromLocalService(existingData);
      
      // Apply the result to component state
      this.currentMood = result.currentMood;
      this.currentEnergy = result.currentEnergy;
      this.notes = result.notes;
      this.selectedItems = result.selectedItems;
      this.quickSymptoms = result.quickSymptoms;
      this.selectedSymptoms = result.selectedSymptoms;
      this.hasDataForDate = result.hasDataForDate;
      
      // Update form with loaded data
      this.symptomsForm.patchValue({
        mood: this.currentMood,
        energy: this.currentEnergy,
        notes: this.notes
      });
      
      this.showToast(`Data loaded for ${this.getFormattedDate()}`, 'success');
      this.cdr.detectChanges();
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
    return this.symptomsUIService.getFormattedDate(this.selectedDate);
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
  }

  selectMood(moodId: string): void {
    this.currentMood = moodId;
  }

  getMoodOptions(): any[] {
    return this.symptomsUIService.getMoodOptions();
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
  }

  viewHistory(): void {
    this.router.navigate(['/symptoms-history']);
  }

  private   formatDateForInput(date: Date): string {
    return this.symptomsUIService.formatDateForInput(date);
  }

  private loadDayData(): void {
    // Load data for the selected day
    
    // First try to get data from API
    const userId = this.getUserId();
    if (userId && userId !== 'anonymous') {
        this.trackDataService.getTrackDay(parseInt(userId), this.selectedDate).subscribe({
          next: (apiData) => {
            
            // Check if we have data (could be object or array)
            if (apiData) {
              // If it's an array, take the first element, otherwise use the object directly
              const dataToLoad = Array.isArray(apiData) ? apiData[0] : apiData;
              
              if (dataToLoad && (dataToLoad.symptoms || dataToLoad.mood || dataToLoad.energy || dataToLoad.notes)) {
                this.loadExistingDataFromAPI(dataToLoad);
              } else {
                // Fallback to local storage if no meaningful API data
                const existingData = this.trackDataService.getTrackDataByDate(this.selectedDate);
                if (existingData) {
                  this.loadExistingDataFromService(existingData);
                } else {
                  this.resetForm();
                }
              }
            } else {
              // Fallback to local storage if no API data
              const existingData = this.trackDataService.getTrackDataByDate(this.selectedDate);
              if (existingData) {
                this.loadExistingDataFromService(existingData);
              } else {
                this.resetForm();
              }
            }
          },
        error: (error) => {
          // Fallback to local storage if API fails
          const existingData = this.trackDataService.getTrackDataByDate(this.selectedDate);
          if (existingData) {
            this.loadExistingDataFromService(existingData);
          } else {
            this.resetForm();
          }
        }
      });
    } else {
      // Fallback to local storage if no user ID
      const existingData = this.trackDataService.getTrackDataByDate(this.selectedDate);
      if (existingData) {
        this.loadExistingDataFromService(existingData);
      } else {
        this.resetForm();
      }
    }
  }

  getSymptomName(symptom: string): string {
    return this.symptomsUIService.getSymptomName(symptom);
  }

  getSymptomIcon(symptom: string): string {
    return this.symptomsUIService.getSymptomIcon(symptom);
  }

  getCurrentMoodName(): string {
    return this.symptomsUIService.getCurrentMoodName(this.currentMood);
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
    return this.symptomsUIService.getMoodEmoji(mood);
  }

  getEnergyEmoji(energy: string): string {
    return this.symptomsUIService.getEnergyEmoji(energy);
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

  getCurrentPregnancyWeek(): number {
    return this.symptomsUIService.getCurrentPregnancyWeek();
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
