import { AfterViewInit, Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import Swiper from 'swiper';
import { MessageService } from '../shared/services/message.service';
import { CirclePeriodChart } from '../shared/components/circle-period-chart/circle-period-chart';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports:[SharedModule, CirclePeriodChart],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeComponent implements OnInit, AfterViewInit {
  welcomeMessage: string = '';
  dailyMessage: string = '';
  userName: string = 'Ali'; // This would come from your user service

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private messageService: MessageService
  ) { }

  ngAfterViewInit() {
    var swiper = new Swiper('.mySwiper', {
      slidesPerView: 3,
      spaceBetween: 10,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
    });
  }

  ngOnInit() {
    this.generateMessages();
  }

  /**
   * Generate personalized messages for the user
   */
  generateMessages() {
    // Generate welcome message with user's name
    this.welcomeMessage = this.messageService.generateWelcomeMessage(this.userName);
    
    // Generate daily inspirational message
    this.dailyMessage = this.messageService.generateDailyMessage();
    
    // You can also generate pregnancy-specific messages if needed
    // this.dailyMessage = this.messageService.generatePregnancyDailyMessage(28);
  }

  /**
   * Generate a new daily message (useful for refresh or new day)
   */
  refreshDailyMessage() {
    this.dailyMessage = this.messageService.generateDailyMessage();
    this.showToast('New daily message generated! ✨');
  }

  /**
   * Generate mood-based message
   */
  generateMoodMessage(mood: string) {
    const moodMessage = this.messageService.generateMoodBasedMessage(mood);
    this.showToast(moodMessage);
  }

  // Hero Section Actions
  trackToday() {
    this.showToast('Opening today\'s tracking... 📊');
    // Add your tracking logic here
  }

  viewCalendar() {
    this.showToast('Opening calendar view... 📅');
    // Add your calendar logic here
  }

  // Open daily tracking modal
  async openDailyTracking() {
    const alert = await this.alertController.create({
      header: '📊 Track Today',
      message: 'What would you like to track today?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: '📝 Symptoms & Mood',
          handler: () => {
            this.openSymptomsTracking();
          }
        },
        {
          text: '💊 Medications',
          handler: () => {
            this.openMedicationReminder();
          }
        },
        {
          text: '🥗 Nutrition',
          handler: () => {
            this.openNutritionTracker();
          }
        },
        {
          text: '🏃‍♀️ Exercise',
          handler: () => {
            this.openExercisePlanner();
          }
        }
      ]
    });

    await alert.present();
  }

  // Open calendar view
  async openCalendarView() {
    const alert = await this.alertController.create({
      header: '📅 Calendar View',
      message: 'Choose what you\'d like to view in your calendar:',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: '📊 Cycle Tracking',
          handler: () => {
            this.router.navigate(['/tools']);
            this.showToast('Opening cycle tracking calendar...', 'success');
          }
        },
        {
          text: '📝 Symptoms Log',
          handler: () => {
            this.router.navigate(['/tools']);
            this.showToast('Opening symptoms calendar...', 'success');
          }
        },
        {
          text: '💊 Medication Schedule',
          handler: () => {
            this.router.navigate(['/tools']);
            this.showToast('Opening medication calendar...', 'success');
          }
        },
        {
          text: '📅 Appointments',
          handler: () => {
            this.openAppointmentBooking();
          }
        }
      ]
    });

    await alert.present();
  }

  // Quick Actions with proper functionality
  async onActionClick(action: string) {
    switch(action) {
      case 'pregnant':
        await this.handlePregnancyUpdate();
        break;
      case 'symptoms':
        await this.openSymptomsTracking();
        break;
      case 'appointment':
        await this.openAppointmentBooking();
        break;
      case 'community':
        await this.navigateToCommunity();
        break;
    }
  }

  // Handle "I became pregnant" action
  async handlePregnancyUpdate() {
    const alert = await this.alertController.create({
      header: '🎉 Congratulations!',
      message: 'This is wonderful news! Let\'s update your status and guide you through the next steps.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Update Status',
          handler: async () => {
            await this.updatePregnancyStatus();
          }
        }
      ]
    });

    await alert.present();
  }

  // Update pregnancy status
  async updatePregnancyStatus() {
    try {
      // Here you would typically make an API call to update the user's status
      // For now, we'll simulate the update
      
      const successAlert = await this.alertController.create({
        header: '✅ Status Updated!',
        message: 'Your pregnancy status has been updated successfully!',
        buttons: [
          {
            text: 'View Pregnancy Guide',
            handler: () => {
              this.router.navigate(['tabs/tools']);
            }
          },
          {
            text: 'Continue',
            role: 'cancel'
          }
        ]
      });

      await successAlert.present();
      await this.showToast('Pregnancy status updated successfully!', 'success');
      
    } catch (error) {
      await this.showToast('Failed to update status. Please try again.', 'danger');
    }
  }

  // Open symptoms tracking
  async openSymptomsTracking() {
    const alert = await this.alertController.create({
      header: '📝 Track Your Symptoms',
      message: 'How are you feeling today? Let\'s track your symptoms and mood.',
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
          text: 'Track Symptoms',
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

  // Track symptoms
  async trackSymptoms(mood: string) {
    try {
      const moodEmoji: Record<string, string> = {
        'great': '😊',
        'okay': '😐',
        'not_great': '😔'
      };

      await this.showToast(`${moodEmoji[mood]} Symptoms tracked successfully!`, 'success');
      
    } catch (error) {
      await this.showToast('Failed to track symptoms. Please try again.', 'danger');
    }
  }

  // Open appointment booking
  async openAppointmentBooking() {
    const alert = await this.alertController.create({
      header: '📅 Book Appointment',
      message: 'Choose the type of consultation you need:',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Prenatal Care',
          handler: () => {
            this.bookAppointment('prenatal');
          }
        },
        {
          text: 'Nutrition Consultation',
          handler: () => {
            this.bookAppointment('nutrition');
          }
        },
        {
          text: 'Mental Health Support',
          handler: () => {
            this.bookAppointment('mental_health');
          }
        }
      ]
    });

    await alert.present();
  }

  // Book appointment
  async bookAppointment(type: string) {
    try {
      const typeNames: Record<string, string> = {
        'prenatal': 'Prenatal Care',
        'nutrition': 'Nutrition Consultation',
        'mental_health': 'Mental Health Support'
      };

      await this.showToast(`Opening ${typeNames[type]} booking...`, 'success');
      
      const successAlert = await this.alertController.create({
        header: '✅ Appointment Booking',
        message: `You're being redirected to book your ${typeNames[type]} appointment.`,
        buttons: ['OK']
      });

      await successAlert.present();
      
    } catch (error) {
      await this.showToast('Failed to open appointment booking. Please try again.', 'danger');
    }
  }

  // Navigate to community
  async navigateToCommunity() {
    try {
      await this.showToast('Joining community...', 'success');
      
      const communityAlert = await this.alertController.create({
        header: '👥 Join Our Community',
        message: 'Connect with other women on similar journeys. Share experiences, ask questions, and find support.',
        buttons: [
          {
            text: 'Learn More',
            handler: () => {
              // Navigate to community page
              // this.router.navigate(['/community']);
            }
          },
          {
            text: 'Continue',
            role: 'cancel'
          }
        ]
      });

      await communityAlert.present();
      
    } catch (error) {
      await this.showToast('Failed to join community. Please try again.', 'danger');
    }
  }

  // Daily Tips Actions
  async viewCounselorSchedule() {
    try {
      await this.showToast('Opening counselor schedule...', 'success');
      
      const scheduleAlert = await this.alertController.create({
        header: '👩‍⚕️ Counselor Schedule',
        message: 'View available appointment slots with our expert counselors.',
        buttons: [
          {
            text: 'View Schedule',
            handler: () => {
              // Navigate to schedule page
              // this.router.navigate(['/counselor-schedule']);
            }
          },
          {
            text: 'Continue',
            role: 'cancel'
          }
        ]
      });

      await scheduleAlert.present();
      
    } catch (error) {
      await this.showToast('Failed to open schedule. Please try again.', 'danger');
    }
  }

  // Expert Actions
  async bookExpertConsultation() {
    try {
      await this.showToast('Opening expert consultation booking...', 'success');
      
      const consultationAlert = await this.alertController.create({
        header: '👨‍⚕️ Expert Consultation',
        message: 'Book a consultation with our specialized experts in prenatal care, nutrition, and mental health.',
        buttons: [
          {
            text: 'Book Now',
            handler: () => {
              // Navigate to booking page
              // this.router.navigate(['/expert-consultation']);
            }
          },
          {
            text: 'Continue',
            role: 'cancel'
          }
        ]
      });

      await consultationAlert.present();
      
    } catch (error) {
      await this.showToast('Failed to open consultation booking. Please try again.', 'danger');
    }
  }

  // Community Actions
  async joinCommunity() {
    await this.navigateToCommunity();
  }

  // Floating Action Button
  async openQuickMenu() {
    const actionSheet = await this.alertController.create({
      header: 'Quick Actions',
      buttons: [
        {
          text: '📝 Add Symptom Entry',
          handler: () => {
            this.openSymptomsTracking();
          }
        },
        {
          text: '📅 Book Appointment',
          handler: () => {
            this.openAppointmentBooking();
          }
        },
        {
          text: '📊 View Progress',
          handler: () => {
            this.router.navigate(['/tools']);
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

  // Health Tools Methods
  async openFertilityCalculator() {
    try {
      await this.showToast('Opening fertility calculator...', 'success');
      
      const calculatorAlert = await this.alertController.create({
        header: '🧮 Fertility Calculator',
        message: 'Calculate your most fertile days based on your cycle length and last period date.',
        buttons: [
          {
            text: 'Open Calculator',
            handler: () => {
              this.router.navigate(['/tools']);
            }
          },
          {
            text: 'Continue',
            role: 'cancel'
          }
        ]
      });

      await calculatorAlert.present();
      
    } catch (error) {
      await this.showToast('Failed to open fertility calculator. Please try again.', 'danger');
    }
  }

  async openNutritionTracker() {
    try {
      await this.showToast('Opening nutrition tracker...', 'success');
      
      const nutritionAlert = await this.alertController.create({
        header: '🥗 Nutrition Tracker',
        message: 'Track your daily nutrition intake, including vitamins, minerals, and food groups essential for pregnancy.',
        buttons: [
          {
            text: 'Start Tracking',
            handler: () => {
              this.router.navigate(['/tools']);
            }
          },
          {
            text: 'Continue',
            role: 'cancel'
          }
        ]
      });

      await nutritionAlert.present();
      
    } catch (error) {
      await this.showToast('Failed to open nutrition tracker. Please try again.', 'danger');
    }
  }

  async openExercisePlanner() {
    try {
      await this.showToast('Opening exercise planner...', 'success');
      
      const exerciseAlert = await this.alertController.create({
        header: '🏃‍♀️ Exercise Planner',
        message: 'Get personalized exercise recommendations safe for each trimester of pregnancy.',
        buttons: [
          {
            text: 'View Exercises',
            handler: () => {
              this.router.navigate(['/tools']);
            }
          },
          {
            text: 'Continue',
            role: 'cancel'
          }
        ]
      });

      await exerciseAlert.present();
      
    } catch (error) {
      await this.showToast('Failed to open exercise planner. Please try again.', 'danger');
    }
  }

  async openMedicationReminder() {
    try {
      await this.showToast('Opening medication reminder...', 'success');
      
      const medicationAlert = await this.alertController.create({
        header: '💊 Medication Reminder',
        message: 'Set reminders for your prenatal vitamins and medications to ensure you never miss a dose.',
        buttons: [
          {
            text: 'Set Reminders',
            handler: () => {
              this.router.navigate(['/tools']);
            }
          },
          {
            text: 'Continue',
            role: 'cancel'
          }
        ]
      });

      await medicationAlert.present();
      
    } catch (error) {
      await this.showToast('Failed to open medication reminder. Please try again.', 'danger');
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

  tabChanged() {
    // Handle tab changes if needed
  }
}
