import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import { ToolsService, 
         SymptomEntry, 
         CycleEntry, 
         WeightEntry, 
         BloodPressureEntry, 
         SleepEntry, 
         WaterIntakeEntry,
         KickCountEntry,
         ContractionEntry,
         PregnancyProgress,
         ExerciseEntry,
         MeditationEntry,
         MoodEntry,
         GratitudeEntry,
         MedicationReminder,
         VitaminEntry,
         AppointmentReminder,
         HealthReport } from '../shared/services/tools.service';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss'],
  standalone: true,
  imports:[...SHARED_STANDALONE_IMPORTS],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class ToolsComponent implements OnInit {
  private cycleSettings = inject(CycleSettingsService);
  private route = inject(ActivatedRoute);

  // User data
  currentUserId: number = 1; // This should come from auth service
  isLoading = false;

  // Today's stats
  todayStats = {
    symptoms: 0,
    weight: false,
    bloodPressure: false,
    sleep: false,
    waterIntake: 0,
    mood: '',
    vitamins: [] as string[],
    completionRate: 0
  };

  // Current sessions
  currentKickSession: string | null = null;
  currentContractionSession: string | null = null;
  currentMeditationSession: string | null = null;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private toolsService: ToolsService
  ) { }

  ngOnInit() {
    this.loadTodayStats();
    
    // Check if we need to auto-open a specific tool
    this.route.queryParams.subscribe(params => {
      if (params['openTool']) {
        setTimeout(() => {
          this.handleAutoOpenTool(params['openTool']);
        }, 500); // Small delay to ensure component is fully loaded
      }
    });
  }

  // Handle auto-opening tools from navigation
  private async handleAutoOpenTool(toolName: string) {
    switch (toolName) {
      case 'fertility':
        await this.openFertilityCalculator();
        break;
      case 'symptoms':
        await this.openSymptomTracker();
        break;
      case 'cycle':
        await this.openCycleTracker();
        break;
      default:
        console.log('Unknown tool:', toolName);
    }
  }

  // Load today's statistics
  async loadTodayStats() {
    try {
      this.isLoading = true;
      // const stats = await this.toolsService.getTodayStats(this.currentUserId).toPromise();
      // if (stats) {
      //   this.todayStats = stats;
      // }
    } catch (error) {
      console.error('Error loading today stats:', error);
      await this.showToast('Failed to load today\'s statistics', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // Quick Access Tools
  async openFertilityCalculator() {
    // Check if user is pregnant
    const isPregnant = this.cycleSettings.isPregnant();
    
    if (isPregnant) {
      // Show pregnancy week calculator
      await this.openPregnancyWeekCalculator();
    } else {
      // Show regular fertility calculator
      await this.openRegularFertilityCalculator();
    }
  }

  // Regular fertility calculator for non-pregnant users
  async openRegularFertilityCalculator() {
    const alert = await this.alertController.create({
      header: '🧮 Fertility Calculator',
      message: 'Calculate your most fertile days based on your cycle length and last period date.',
      inputs: [
        {
          name: 'cycleLength',
          type: 'number',
          placeholder: 'Cycle length (days)',
          min: 21,
          max: 35,
          value: 28
        },
        {
          name: 'lastPeriod',
          type: 'date',
          placeholder: 'Last period start date'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Calculate',
          handler: async (data) => {
            if (data.cycleLength && data.lastPeriod) {
              await this.calculateFertileDays(data.cycleLength, data.lastPeriod);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Pregnancy week calculator for pregnant users
  async openPregnancyWeekCalculator() {
    const alert = await this.alertController.create({
      header: '🤰 Pregnancy Week Calculator',
      message: 'Calculate your current pregnancy week based on your last menstrual period (LMP) date.',
      inputs: [
        {
          name: 'lastPeriod',
          type: 'date',
          placeholder: 'Last menstrual period date',
          label: 'LMP Date'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Calculate Week',
          handler: async (data) => {
            if (data.lastPeriod) {
              await this.calculatePregnancyWeek(data.lastPeriod);
            }
          }
        },
        {
          text: 'Edit Status',
          handler: () => {
            this.openPregnancyStatusEditor();
          }
        }
      ]
    });

    await alert.present();
  }

  // Direct pregnancy status editor
  async openPregnancyStatusEditor() {
    const currentWeek = this.cycleSettings.pregnancyWeek();
    const isPregnant = this.cycleSettings.isPregnant();
    
    const alert = await this.alertController.create({
      header: '🤰 Edit Pregnancy Status',
      message: 'Update your pregnancy information.',
      inputs: [
        {
          name: 'pregnancyWeek',
          type: 'number',
          placeholder: 'Current pregnancy week',
          min: 4,
          max: 40,
          value: currentWeek.toString(),
          label: 'Pregnancy Week (4-40)'
        },
        {
          name: 'status',
          type: 'radio',
          label: 'I am pregnant',
          value: 'pregnant',
          checked: isPregnant
        },
        {
          name: 'status',
          type: 'radio',
          label: 'I am not pregnant',
          value: 'not-pregnant',
          checked: !isPregnant
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Update Status',
          handler: async (data) => {
            await this.updatePregnancyStatus(data);
          }
        }
      ]
    });

    await alert.present();
  }

  // Update pregnancy status
  private async updatePregnancyStatus(data: any) {
    try {
      const week = parseInt(data.pregnancyWeek);
      const isPregnant = data.status === 'pregnant';
      
      if (isPregnant) {
        // Update pregnancy status
        this.cycleSettings.setUserStatus('Pregnant');
        // this.cycleSettings.setPregnancyStatus(true);
        this.cycleSettings.setPostpartumStatus(false);
        
        // Update pregnancy week if valid
        if (week >= 4 && week <= 40) {
          this.cycleSettings.setPregnancyWeek(week);
          const progress = (week / 40) * 100;
          this.cycleSettings.setPregnancyProgress(progress);
        }
        
        await this.showToast('Pregnancy status updated successfully!', 'success');
      } else {
        // Update to trying to conceive
        this.cycleSettings.setUserStatus('Trying to Conceive');
        // this.cycleSettings.setPregnancyStatus(false);
        this.cycleSettings.setPostpartumStatus(false);
        
        await this.showToast('Status updated to "Trying to Conceive"', 'success');
      }
      
    } catch (error) {
      console.error('Error updating pregnancy status:', error);
      await this.showToast('Failed to update status', 'danger');
    }
  }

  async openSymptomTracker() {
    const alert = await this.alertController.create({
      header: '📝 Symptom Tracker',
      message: 'Track your daily symptoms and mood.',
      inputs: [
        {
          name: 'mood',
          type: 'radio',
          label: '😊 Great',
          value: 'great'
        },
        {
          name: 'mood',
          type: 'radio',
          label: '😐 Okay',
          value: 'okay'
        },
        {
          name: 'mood',
          type: 'radio',
          label: '😔 Not Great',
          value: 'not_great'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Track',
          handler: async (data) => {
            if (data.mood) {
              await this.trackSymptoms(data.mood);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async openCycleTracker() {
    const alert = await this.alertController.create({
      header: '📅 Cycle Tracker',
      message: 'Track your menstrual cycle and predict next period.',
      inputs: [
        {
          name: 'periodStart',
          type: 'date',
          placeholder: 'Period start date'
        },
        {
          name: 'cycleLength',
          type: 'number',
          placeholder: 'Average cycle length',
          min: 21,
          max: 35,
          value: 28
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Track',
          handler: async (data) => {
            if (data.periodStart && data.cycleLength) {
              await this.trackCycle(data.periodStart, data.cycleLength);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async openNutritionTracker() {
    const alert = await this.alertController.create({
      header: '🥗 Nutrition Tracker',
      message: 'Track your daily nutrition intake.',
      inputs: [
        {
          name: 'meals',
          type: 'radio',
          label: '🍳 Breakfast',
          value: 'breakfast'
        },
        {
          name: 'meals',
          type: 'radio',
          label: '🍽️ Lunch',
          value: 'lunch'
        },
        {
          name: 'meals',
          type: 'radio',
          label: '🍴 Dinner',
          value: 'dinner'
        },
        {
          name: 'meals',
          type: 'radio',
          label: '🍎 Snacks',
          value: 'snacks'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Track',
          handler: async (data) => {
            if (data.meals) {
              await this.trackNutrition(data.meals);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Health Monitoring Tools
  async openWeightTracker() {
    const alert = await this.alertController.create({
      header: '⚖️ Weight Tracker',
      message: 'Track your weight changes during pregnancy.',
      inputs: [
        {
          name: 'weight',
          type: 'number',
          placeholder: 'Weight (kg)',
          min: 30,
          max: 200
        },
        {
          name: 'notes',
          type: 'text',
          placeholder: 'Notes (optional)'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Track',
          handler: async (data) => {
            if (data.weight) {
              await this.trackWeight(data.weight, data.notes);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async openBloodPressureTracker() {
    const alert = await this.alertController.create({
      header: '❤️ Blood Pressure Tracker',
      message: 'Monitor your blood pressure readings.',
      inputs: [
        {
          name: 'systolic',
          type: 'number',
          placeholder: 'Systolic (top number)',
          min: 70,
          max: 200
        },
        {
          name: 'diastolic',
          type: 'number',
          placeholder: 'Diastolic (bottom number)',
          min: 40,
          max: 130
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Track',
          handler: async (data) => {
            if (data.systolic && data.diastolic) {
              await this.trackBloodPressure(data.systolic, data.diastolic);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async openSleepTracker() {
    const alert = await this.alertController.create({
      header: '😴 Sleep Tracker',
      message: 'Track your sleep quality and duration.',
      inputs: [
        {
          name: 'sleepHours',
          type: 'number',
          placeholder: 'Hours of sleep',
          min: 0,
          max: 24,
          value: 8
        },
        {
          name: 'sleepQuality',
          type: 'radio',
          label: '😴 Poor',
          value: 'poor'
        },
        {
          name: 'sleepQuality',
          type: 'radio',
          label: '😐 Fair',
          value: 'fair'
        },
        {
          name: 'sleepQuality',
          type: 'radio',
          label: '😊 Good',
          value: 'good'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Track',
          handler: async (data) => {
            if (data.sleepHours && data.sleepQuality) {
              await this.trackSleep(data.sleepHours, data.sleepQuality);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async openWaterIntakeTracker() {
    const alert = await this.alertController.create({
      header: '💧 Water Intake Tracker',
      message: 'Track your daily water consumption.',
      inputs: [
        {
          name: 'waterAmount',
          type: 'number',
          placeholder: 'Water amount (ml)',
          min: 100,
          max: 5000,
          value: 250
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Track',
          handler: async (data) => {
            if (data.waterAmount) {
              await this.trackWaterIntake(data.waterAmount);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Pregnancy Specific Tools
  async openKickCounter() {
    if (this.currentKickSession) {
      // Stop current session
      await this.stopKickCounter();
    } else {
      // Start new session
      await this.startKickCounter();
    }
  }

  async openContractionTimer() {
    if (this.currentContractionSession) {
      // Stop current timer
      await this.stopContractionTimer();
    } else {
      // Start new timer
      await this.startContractionTimer();
    }
  }

  async openDueDateCalculator() {
    const alert = await this.alertController.create({
      header: '📅 Due Date Calculator',
      message: 'Calculate your pregnancy due date.',
      inputs: [
        {
          name: 'lastPeriod',
          type: 'date',
          placeholder: 'First day of last period'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Calculate',
          handler: async (data) => {
            if (data.lastPeriod) {
              await this.calculateDueDate(data.lastPeriod);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async openPregnancyWeekTracker() {
    const alert = await this.alertController.create({
      header: '📊 Pregnancy Week Tracker',
      message: 'Track your pregnancy progress by week.',
      inputs: [
        {
          name: 'pregnancyWeek',
          type: 'number',
          placeholder: 'Current pregnancy week',
          min: 1,
          max: 42,
          value: 1
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Track',
          handler: async (data) => {
            if (data.pregnancyWeek) {
              await this.trackPregnancyWeek(data.pregnancyWeek);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Wellness Tools
  async openExercisePlanner() {
    const alert = await this.alertController.create({
      header: '🏃‍♀️ Exercise Planner',
      message: 'Get personalized exercise recommendations for your trimester.',
      inputs: [
        {
          name: 'trimester',
          type: 'radio',
          label: '1️⃣ First Trimester',
          value: 'first'
        },
        {
          name: 'trimester',
          type: 'radio',
          label: '2️⃣ Second Trimester',
          value: 'second'
        },
        {
          name: 'trimester',
          type: 'radio',
          label: '3️⃣ Third Trimester',
          value: 'third'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Get Exercises',
          handler: async (data) => {
            if (data.trimester) {
              await this.getExercisePlan(data.trimester);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async openMeditationTimer() {
    const alert = await this.alertController.create({
      header: '🧘‍♀️ Meditation Timer',
      message: 'Start a guided meditation session.',
      inputs: [
        {
          name: 'duration',
          type: 'radio',
          label: '5 minutes',
          value: 5
        },
        {
          name: 'duration',
          type: 'radio',
          label: '10 minutes',
          value: 10
        },
        {
          name: 'duration',
          type: 'radio',
          label: '15 minutes',
          value: 15
        },
        {
          name: 'duration',
          type: 'radio',
          label: '20 minutes',
          value: 20
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Start Session',
          handler: async (data) => {
            if (data.duration) {
              await this.startMeditationSession(data.duration);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async openMoodTracker() {
    const alert = await this.alertController.create({
      header: '😊 Mood Tracker',
      message: 'Track your emotional well-being today.',
      inputs: [
        {
          name: 'mood',
          type: 'radio',
          label: '😊 Happy',
          value: 'happy'
        },
        {
          name: 'mood',
          type: 'radio',
          label: '😐 Neutral',
          value: 'neutral'
        },
        {
          name: 'mood',
          type: 'radio',
          label: '😔 Sad',
          value: 'sad'
        },
        {
          name: 'mood',
          type: 'radio',
          label: '😤 Anxious',
          value: 'anxious'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Track',
          handler: async (data) => {
            if (data.mood) {
              await this.trackMood(data.mood);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async openGratitudeJournal() {
    const alert = await this.alertController.create({
      header: '💝 Gratitude Journal',
      message: 'Write down something you\'re grateful for today.',
      inputs: [
        {
          name: 'gratitude',
          type: 'textarea',
          placeholder: 'What are you grateful for today?'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: async (data) => {
            if (data.gratitude) {
              await this.saveGratitudeEntry(data.gratitude);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Medication Tools
  async openMedicationReminder() {
    const alert = await this.alertController.create({
      header: '💊 Medication Reminder',
      message: 'Set reminders for your medications.',
      inputs: [
        {
          name: 'medication',
          type: 'text',
          placeholder: 'Medication name'
        },
        {
          name: 'time',
          type: 'time',
          placeholder: 'Reminder time'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Set Reminder',
          handler: async (data) => {
            if (data.medication && data.time) {
              await this.setMedicationReminder(data.medication, data.time);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async openVitaminTracker() {
    const alert = await this.alertController.create({
      header: '💊 Vitamin Tracker',
      message: 'Track your prenatal vitamins.',
      inputs: [
        {
          name: 'vitamin',
          type: 'radio',
          label: '💊 Prenatal Multivitamin',
          value: 'prenatal'
        },
        {
          name: 'vitamin',
          type: 'radio',
          label: '🦴 Calcium',
          value: 'calcium'
        },
        {
          name: 'vitamin',
          type: 'radio',
          label: '🐟 Omega-3',
          value: 'omega3'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Track',
          handler: async (data) => {
            if (data.vitamin) {
              await this.trackVitamin(data.vitamin);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async openAppointmentReminder() {
    const alert = await this.alertController.create({
      header: '📅 Appointment Reminder',
      message: 'Set reminders for your doctor visits.',
      inputs: [
        {
          name: 'appointment',
          type: 'text',
          placeholder: 'Appointment type'
        },
        {
          name: 'date',
          type: 'date',
          placeholder: 'Appointment date'
        },
        {
          name: 'time',
          type: 'time',
          placeholder: 'Appointment time'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Set Reminder',
          handler: async (data) => {
            if (data.appointment && data.date && data.time) {
              await this.setAppointmentReminder(data.appointment, data.date, data.time);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  // Progress & Reports
  async openHealthReport() {
    const alert = await this.alertController.create({
      header: '📊 Health Report',
      message: 'View your comprehensive health summary.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'View Report',
          handler: async () => {
            await this.showHealthReport();
          }
        }
      ]
    });

    await alert.present();
  }

  async openTrendsAnalysis() {
    const alert = await this.alertController.create({
      header: '📈 Trends Analysis',
      message: 'View patterns and trends in your health data.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'View Trends',
          handler: async () => {
            await this.showTrendsAnalysis();
          }
        }
      ]
    });

    await alert.present();
  }

  // Utility Methods
  async openSettings() {
    await this.showToast('Settings opened', 'success');
  }

  async openQuickAdd() {
    const actionSheet = await this.alertController.create({
      header: 'Quick Add',
      buttons: [
        {
          text: '📝 Add Symptom',
          handler: () => {
            this.openSymptomTracker();
          }
        },
        {
          text: '💊 Add Medication',
          handler: () => {
            this.openMedicationReminder();
          }
        },
        {
          text: '🥗 Add Nutrition',
          handler: () => {
            this.openNutritionTracker();
          }
        },
        {
          text: '❌ Cancel',
          role: 'cancel'
        }
      ]
    });

    await actionSheet.present();
  }

  // API Implementation Methods
  private async calculateFertileDays(cycleLength: number, lastPeriod: string) {
    try {
      this.isLoading = true;
      const result = await this.toolsService.calculateFertileDays(cycleLength, lastPeriod).toPromise();
      if (result) {
        const alert = await this.alertController.create({
          header: '🧮 Fertility Calculation Results',
          message: `Your fertile days: ${result.fertileDays.join(', ')}\nNext period: ${result.nextPeriod}`,
          buttons: ['OK']
        });
        await alert.present();
        await this.showToast('Fertile days calculated successfully!', 'success');
      }
    } catch (error) {
      console.error('Error calculating fertile days:', error);
      await this.showToast('Failed to calculate fertile days', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // Calculate pregnancy week and update progress
  private async calculatePregnancyWeek(lastPeriod: string) {
    try {
      this.isLoading = true;
      
      // Calculate pregnancy week based on LMP
      const lmpDate = new Date(lastPeriod);
      const today = new Date();
      const daysDifference = Math.floor((today.getTime() - lmpDate.getTime()) / (1000 * 60 * 60 * 24));
      const pregnancyWeek = Math.floor(daysDifference / 7) + 1;
      
      // Validate pregnancy week (should be between 4-40 weeks)
      if (pregnancyWeek < 4 || pregnancyWeek > 40) {
        await this.showToast('Invalid date. Please enter a valid LMP date.', 'warning');
        return;
      }
      
      // Update pregnancy week in CycleSettingsService
      this.cycleSettings.setPregnancyWeek(pregnancyWeek);
      
      // Calculate pregnancy progress percentage
      const pregnancyProgress = (pregnancyWeek / 40) * 100;
      this.cycleSettings.setPregnancyProgress(pregnancyProgress);
      
      // Show results
      const alert = await this.alertController.create({
        header: '🤰 Pregnancy Week Calculated!',
        message: `You are currently in week ${pregnancyWeek} of your pregnancy.\n\nThis information has been updated in your pregnancy progress tracker.`,
        buttons: [
          {
            text: 'View Progress',
            handler: () => {
              this.router.navigate(['/tabs/home']);
            }
          },
          {
            text: 'Continue',
            role: 'cancel'
          }
        ]
      });
      
      await alert.present();
      await this.showToast(`Pregnancy week ${pregnancyWeek} calculated successfully!`, 'success');
      
    } catch (error) {
      console.error('Error calculating pregnancy week:', error);
      await this.showToast('Failed to calculate pregnancy week', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async trackSymptoms(mood: string) {
    try {
      this.isLoading = true;
      const entry: SymptomEntry = {
        userId: this.currentUserId,
        mood,
        date: new Date().toISOString().split('T')[0],
        symptoms: []
      };
      
      const result = await this.toolsService.trackSymptoms(entry).toPromise();
      if (result) {
        await this.showToast(`Symptoms tracked: ${mood}`, 'success');
        await this.loadTodayStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error tracking symptoms:', error);
      await this.showToast('Failed to track symptoms', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async trackCycle(periodStart: string, cycleLength: number) {
    try {
      this.isLoading = true;
      const entry: CycleEntry = {
        userId: this.currentUserId,
        periodStart,
        cycleLength
      };
      
      const result = await this.toolsService.trackCycle(entry).toPromise();
      if (result) {
        await this.showToast('Cycle tracked successfully!', 'success');
      }
    } catch (error) {
      console.error('Error tracking cycle:', error);
      await this.showToast('Failed to track cycle', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async trackNutrition(meal: string) {
    try {
      this.isLoading = true;
      // For nutrition tracking, you might want to create a separate service
      await this.showToast(`${meal} nutrition tracked!`, 'success');
    } catch (error) {
      console.error('Error tracking nutrition:', error);
      await this.showToast('Failed to track nutrition', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async trackWeight(weight: number, notes?: string) {
    try {
      this.isLoading = true;
      const entry: WeightEntry = {
        userId: this.currentUserId,
        weight,
        notes,
        date: new Date().toISOString().split('T')[0]
      };
      
      const result = await this.toolsService.trackWeight(entry).toPromise();
      if (result) {
        await this.showToast(`Weight tracked: ${weight}kg`, 'success');
        await this.loadTodayStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error tracking weight:', error);
      await this.showToast('Failed to track weight', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async trackBloodPressure(systolic: number, diastolic: number) {
    try {
      this.isLoading = true;
      const entry: BloodPressureEntry = {
        userId: this.currentUserId,
        systolic,
        diastolic,
        date: new Date().toISOString().split('T')[0]
      };
      
      const result = await this.toolsService.trackBloodPressure(entry).toPromise();
      if (result) {
        await this.showToast(`BP tracked: ${systolic}/${diastolic}`, 'success');
        await this.loadTodayStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error tracking blood pressure:', error);
      await this.showToast('Failed to track blood pressure', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async trackSleep(hours: number, quality: string) {
    try {
      this.isLoading = true;
      const entry: SleepEntry = {
        userId: this.currentUserId,
        sleepHours: hours,
        sleepQuality: quality,
        date: new Date().toISOString().split('T')[0]
      };
      
      const result = await this.toolsService.trackSleep(entry).toPromise();
      if (result) {
        await this.showToast(`Sleep tracked: ${hours}h, ${quality} quality`, 'success');
        await this.loadTodayStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error tracking sleep:', error);
      await this.showToast('Failed to track sleep', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async trackWaterIntake(amount: number) {
    try {
      this.isLoading = true;
      const entry: WaterIntakeEntry = {
        userId: this.currentUserId,
        amount,
        date: new Date().toISOString().split('T')[0]
      };
      
      const result = await this.toolsService.trackWaterIntake(entry).toPromise();
      if (result) {
        await this.showToast(`Water intake tracked: ${amount}ml`, 'success');
        await this.loadTodayStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error tracking water intake:', error);
      await this.showToast('Failed to track water intake', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async startKickCounter() {
    try {
      this.isLoading = true;
      const result = await this.toolsService.startKickCounter(this.currentUserId).toPromise();
      if (result) {
        this.currentKickSession = result.sessionId;
        await this.showToast('Kick counter started!', 'success');
      }
    } catch (error) {
      console.error('Error starting kick counter:', error);
      await this.showToast('Failed to start kick counter', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async stopKickCounter() {
    try {
      this.isLoading = true;
      if (this.currentKickSession) {
        const result = await this.toolsService.recordKickCount(this.currentKickSession, 0).toPromise();
        if (result) {
          this.currentKickSession = null;
          await this.showToast('Kick counter stopped!', 'success');
        }
      }
    } catch (error) {
      console.error('Error stopping kick counter:', error);
      await this.showToast('Failed to stop kick counter', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async startContractionTimer() {
    try {
      this.isLoading = true;
      const result = await this.toolsService.startContractionTimer(this.currentUserId).toPromise();
      if (result) {
        this.currentContractionSession = result.sessionId;
        await this.showToast('Contraction timer started!', 'success');
      }
    } catch (error) {
      console.error('Error starting contraction timer:', error);
      await this.showToast('Failed to start contraction timer', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async stopContractionTimer() {
    try {
      this.isLoading = true;
      if (this.currentContractionSession) {
        const result = await this.toolsService.stopContractionTimer(this.currentContractionSession).toPromise();
        if (result) {
          this.currentContractionSession = null;
          await this.showToast('Contraction timer stopped!', 'success');
        }
      }
    } catch (error) {
      console.error('Error stopping contraction timer:', error);
      await this.showToast('Failed to stop contraction timer', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async calculateDueDate(lastPeriod: string) {
    try {
      this.isLoading = true;
      const result = await this.toolsService.calculateDueDate(lastPeriod).toPromise();
      if (result) {
        const alert = await this.alertController.create({
          header: '📅 Due Date Calculation Results',
          message: `Your due date: ${result.dueDate}\nCurrent pregnancy week: ${result.pregnancyWeek}`,
          buttons: ['OK']
        });
        await alert.present();
        await this.showToast('Due date calculated successfully!', 'success');
      }
    } catch (error) {
      console.error('Error calculating due date:', error);
      await this.showToast('Failed to calculate due date', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async trackPregnancyWeek(week: number) {
    try {
      this.isLoading = true;
      const entry: PregnancyProgress = {
        userId: this.currentUserId,
        pregnancyWeek: week,
        dueDate: new Date().toISOString().split('T')[0] // This should be calculated
      };
      
      const result = await this.toolsService.trackPregnancyProgress(entry).toPromise();
      if (result) {
        await this.showToast(`Pregnancy week ${week} tracked!`, 'success');
      }
    } catch (error) {
      console.error('Error tracking pregnancy week:', error);
      await this.showToast('Failed to track pregnancy week', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async getExercisePlan(trimester: string) {
    try {
      this.isLoading = true;
      const result = await this.toolsService.getExercisePlan(trimester).toPromise();
      if (result) {
        const alert = await this.alertController.create({
          header: `🏃‍♀️ ${trimester.charAt(0).toUpperCase() + trimester.slice(1)} Trimester Exercises`,
          message: `Recommended exercises: ${result.exercises.map(e => e.name).join(', ')}\n\nRecommendations: ${result.recommendations.join('\n')}`,
          buttons: ['OK']
        });
        await alert.present();
        await this.showToast(`${trimester} trimester exercises loaded!`, 'success');
      }
    } catch (error) {
      console.error('Error getting exercise plan:', error);
      await this.showToast('Failed to load exercise plan', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async startMeditationSession(duration: number) {
    try {
      this.isLoading = true;
      const result = await this.toolsService.startMeditationSession(this.currentUserId, duration).toPromise();
      if (result) {
        this.currentMeditationSession = result.sessionId;
        await this.showToast(`Meditation session started: ${duration} minutes`, 'success');
        
        // Set a timer to complete the session
        setTimeout(async () => {
          await this.completeMeditationSession(result.sessionId);
        }, duration * 60 * 1000);
      }
    } catch (error) {
      console.error('Error starting meditation session:', error);
      await this.showToast('Failed to start meditation session', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async completeMeditationSession(sessionId: string) {
    try {
      const result = await this.toolsService.completeMeditationSession(sessionId).toPromise();
      if (result) {
        this.currentMeditationSession = null;
        await this.showToast('Meditation session completed!', 'success');
      }
    } catch (error) {
      console.error('Error completing meditation session:', error);
    }
  }

  private async trackMood(mood: string) {
    try {
      this.isLoading = true;
      const entry: MoodEntry = {
        userId: this.currentUserId,
        mood,
        date: new Date().toISOString().split('T')[0]
      };
      
      const result = await this.toolsService.trackMood(entry).toPromise();
      if (result) {
        await this.showToast(`Mood tracked: ${mood}`, 'success');
        await this.loadTodayStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error tracking mood:', error);
      await this.showToast('Failed to track mood', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async saveGratitudeEntry(entry: string) {
    try {
      this.isLoading = true;
      const gratitudeEntry: GratitudeEntry = {
        userId: this.currentUserId,
        entry,
        date: new Date().toISOString().split('T')[0]
      };
      
      const result = await this.toolsService.saveGratitudeEntry(gratitudeEntry).toPromise();
      if (result) {
        await this.showToast('Gratitude entry saved!', 'success');
      }
    } catch (error) {
      console.error('Error saving gratitude entry:', error);
      await this.showToast('Failed to save gratitude entry', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async setMedicationReminder(medication: string, time: string) {
    try {
      this.isLoading = true;
      const reminder: MedicationReminder = {
        userId: this.currentUserId,
        medicationName: medication,
        reminderTime: time,
        frequency: 'daily',
        isActive: true
      };
      
      const result = await this.toolsService.setMedicationReminder(reminder).toPromise();
      if (result) {
        await this.showToast(`Reminder set for ${medication} at ${time}`, 'success');
      }
    } catch (error) {
      console.error('Error setting medication reminder:', error);
      await this.showToast('Failed to set medication reminder', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async trackVitamin(vitamin: string) {
    try {
      this.isLoading = true;
      const entry: VitaminEntry = {
        userId: this.currentUserId,
        vitaminType: vitamin,
        date: new Date().toISOString().split('T')[0],
        taken: true
      };
      
      const result = await this.toolsService.trackVitamin(entry).toPromise();
      if (result) {
        await this.showToast(`${vitamin} tracked!`, 'success');
        await this.loadTodayStats(); // Refresh stats
      }
    } catch (error) {
      console.error('Error tracking vitamin:', error);
      await this.showToast('Failed to track vitamin', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async setAppointmentReminder(appointment: string, date: string, time: string) {
    try {
      this.isLoading = true;
      const reminder: AppointmentReminder = {
        userId: this.currentUserId,
        appointmentType: appointment,
        appointmentDate: date,
        appointmentTime: time,
        isActive: true
      };
      
      const result = await this.toolsService.setAppointmentReminder(reminder).toPromise();
      if (result) {
        await this.showToast(`Reminder set for ${appointment} on ${date} at ${time}`, 'success');
      }
    } catch (error) {
      console.error('Error setting appointment reminder:', error);
      await this.showToast('Failed to set appointment reminder', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async showHealthReport() {
    try {
      this.isLoading = true;
      const result = await this.toolsService.generateHealthReport(
        this.currentUserId,
        'monthly',
        new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      ).toPromise();
      
      if (result) {
        const alert = await this.alertController.create({
          header: '📊 Health Report Generated',
          message: `Completion Rate: ${result.completionRate}%\n\nSymptoms: ${result.symptoms.length}\nWeight entries: ${result.weight.length}\nBP entries: ${result.bloodPressure.length}\nSleep entries: ${result.sleep.length}\nWater intake entries: ${result.waterIntake.length}\nMood entries: ${result.mood.length}`,
          buttons: ['OK']
        });
        await alert.present();
        await this.showToast('Health report generated!', 'success');
      }
    } catch (error) {
      console.error('Error generating health report:', error);
      await this.showToast('Failed to generate health report', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async showTrendsAnalysis() {
    try {
      this.isLoading = true;
      const result = await this.toolsService.analyzeTrends(this.currentUserId, 'mood', 'monthly').toPromise();
      
      if (result) {
        const alert = await this.alertController.create({
          header: '📈 Trends Analysis',
          message: `Insights:\n${result.insights.join('\n')}`,
          buttons: ['OK']
        });
        await alert.present();
        await this.showToast('Trends analysis loaded!', 'success');
      }
    } catch (error) {
      console.error('Error analyzing trends:', error);
      await this.showToast('Failed to load trends analysis', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  // Utility method to show toast messages
  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}
