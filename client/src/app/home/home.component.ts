import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController, ModalController } from '@ionic/angular';
import Swiper from 'swiper';
import { PeriodDatePickerPageComponent, PeriodDateRange } from '../period-date-picker-page/period-date-picker-page.component';
import { CirclePeriodChart } from '../shared/components/circle-period-chart/circle-period-chart';
import { MessageService } from '../shared/services/message.service';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import { SharedModule } from '../shared/shared-module';

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
  
  // User Status and Progress
  userStatus: string = 'Not Set'; // Default state
  isPregnant: boolean = false; // Set to false by default
  isPostpartum: boolean = false;
  
  // Cycle tracking
  currentCycleDay: number = 0;
  periodStartDate: Date | null = null;
  periodLength: number = 5;
  pregnancyWeek: number = 12;
  pregnancyProgress: number = 30; // percentage
  babySize: string = 'Lime 🍋';
  babyWeight: string = '45g';
  
  // Pregnancy tracker properties
  pregnancyStartDate: string = '2024-01-01';
  pregnancyDays: number = 84; // 12 weeks * 7 days
  minDate: string = '2023-01-01';
  maxDate: string = '2025-12-31';
  currentWeekOffset: number = 0; // For scrolling weeks
  
  // Postpartum tracking
  postpartumWeek: number = 1;
  babyAge: string = '1 week old';
  postpartumBabyWeight: string = '3.2kg';
  postpartumBabyLength: string = '50cm';
  feedingMethod: string = 'Breastfeeding';
  sleepPattern: string = 'Every 2-3 hours';
  
  // Postpartum recovery data
  postpartumData: any[] = [
    { week: 1, recovery: 'Physical Healing', symptoms: ['Bleeding', 'Cramping', 'Fatigue'], tips: 'Rest as much as possible, stay hydrated' },
    { week: 2, recovery: 'Emotional Adjustment', symptoms: ['Baby Blues', 'Mood Swings', 'Anxiety'], tips: 'Talk to your partner, seek support' },
    { week: 3, recovery: 'Establishing Routine', symptoms: ['Sleep Deprivation', 'Breastfeeding Challenges'], tips: 'Accept help, practice self-care' },
    { week: 4, recovery: 'Building Confidence', symptoms: ['Self-Doubt', 'Overwhelm'], tips: 'Trust your instincts, celebrate small wins' },
    { week: 5, recovery: 'Physical Recovery', symptoms: ['Hormonal Changes', 'Body Changes'], tips: 'Gentle exercise, healthy nutrition' },
    { week: 6, recovery: 'Emotional Balance', symptoms: ['Postpartum Depression Risk'], tips: 'Monitor mood, seek professional help if needed' },
    { week: 8, recovery: 'New Normal', symptoms: ['Finding Balance', 'Identity Shift'], tips: 'Embrace the journey, be patient with yourself' },
    { week: 12, recovery: 'Thriving', symptoms: ['Confidence Building', 'Routine Established'], tips: 'You\'re doing great! Keep going!' }
  ];
  
  // Baby size data for different weeks
  babySizeData: any[] = [
    { week: 4, size: 'Poppy Seed 🌱', weight: '0.04g', description: 'Tiny as a poppy seed' },
    { week: 5, size: 'Sesame Seed 🌱', weight: '0.1g', description: 'Small as a sesame seed' },
    { week: 6, size: 'Lentil 🌱', weight: '0.2g', description: 'Size of a lentil' },
    { week: 7, size: 'Blueberry 🫐', weight: '1g', description: 'Sweet as a blueberry' },
    { week: 8, size: 'KidneyBean 🫘', weight: '3g', description: 'Shaped like a kidney bean' },
    { week: 9, size: 'Grape 🍇', weight: '7g', description: 'Plump as a grape' },
    { week: 10, size: 'Kumquat 🍊', weight: '14g', description: 'Citrusy kumquat size' },
    { week: 11, size: 'Fig 🫒', weight: '25g', description: 'Sweet fig size' },
    { week: 12, size: 'Lime 🍋', weight: '45g', description: 'Zesty lime size' },
    { week: 13, size: 'Peach 🍑', weight: '70g', description: 'Soft peach size' },
    { week: 14, size: 'Lemon 🍋', weight: '100g', description: 'Bright lemon size' },
    { week: 15, size: 'Apple 🍎', weight: '150g', description: 'Crisp apple size' },
    { week: 16, size: 'Avocado 🥑', weight: '200g', description: 'Creamy avocado size' },
    { week: 17, size: 'Pear 🍐', weight: '250g', description: 'Sweet pear size' },
    { week: 18, size: 'BellPepper 🫑', weight: '300g', description: 'Colorful bell pepper' },
    { week: 19, size: 'Mango 🥭', weight: '400g', description: 'Tropical mango size' },
    { week: 20, size: 'Banana 🍌', weight: '500g', description: 'Banana length' },
    { week: 21, size: 'Carrot 🥕', weight: '600g', description: 'Carrot length' },
    { week: 22, size: 'Coconut 🥥', weight: '700g', description: 'Coconut size' },
    { week: 23, size: 'Grapefruit 🍊', weight: '800g', description: 'Grapefruit size' },
    { week: 24, size: 'Corn 🌽', weight: '900g', description: 'Corn cob length' },
    { week: 25, size: 'Cauliflower 🥦', weight: '1kg', description: 'Cauliflower size' },
    { week: 26, size: 'Lettuce 🥬', weight: '1.2kg', description: 'Lettuce head size' },
    { week: 27, size: 'Broccoli 🥦', weight: '1.4kg', description: 'Broccoli size' },
    { week: 28, size: 'Eggplant 🍆', weight: '1.6kg', description: 'Eggplant size' },
    { week: 29, size: 'ButternutSquash 🎃', weight: '1.8kg', description: 'Squash size' },
    { week: 30, size: 'Cabbage 🥬', weight: '2kg', description: 'Cabbage size' },
    { week: 31, size: 'Pineapple 🍍', weight: '2.2kg', description: 'Pineapple size' },
    { week: 32, size: 'Squash 🎃', weight: '2.4kg', description: 'Large squash' },
    { week: 33, size: 'HoneydewMelon 🍈', weight: '2.6kg', description: 'Melon size' },
    { week: 34, size: 'Cantaloupe 🍈', weight: '2.8kg', description: 'Cantaloupe size' },
    { week: 35, size: 'Honeydew 🍈', weight: '3kg', description: 'Honeydew melon' },
    { week: 36, size: 'RomaineLettuce 🥬', weight: '3.2kg', description: 'Romaine size' },
    { week: 37, size: 'SwissChard 🥬', weight: '3.4kg', description: 'Swiss chard size' },
    { week: 38, size: 'Leek 🧅', weight: '3.6kg', description: 'Leek length' },
    { week: 39, size: 'MiniWatermelon 🍉', weight: '3.8kg', description: 'Mini watermelon' },
    { week: 40, size: 'Watermelon 🍉', weight: '4kg', description: 'Full watermelon size' }
  ];
  
  // Quick Stats
  cycleDay: number = 14;
  temperature: number = 36.8;
  mood: string = 'Happy';
  
  // Appointments
  upcomingAppointments: any[] = [
    {
      day: '15',
      month: 'Dec',
      title: 'Prenatal Checkup',
      time: '10:00 AM',
      doctor: 'Dr. Sarah Johnson'
    },
    {
      day: '22',
      month: 'Dec',
      title: 'Ultrasound',
      time: '2:30 PM',
      doctor: 'Dr. Emily Rodriguez'
    }
  ];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController,
    private messageService: MessageService,
    private cycleSettings: CycleSettingsService
  ) { }

  ngAfterViewInit() {
    try {
      // Initialize Swiper only if the element exists
      const swiperElement = document.querySelector('.mySwiper');
      if (swiperElement) {
        var swiper = new Swiper('.mySwiper', {
          slidesPerView: 2,
          spaceBetween: 5,
          centeredSlides: false,
          loop: false,
          pagination: {
            el: '.swiper-pagination',
            clickable: true,
            dynamicBullets: true,
          },
          breakpoints: {
            480: {
              slidesPerView: 2,
              spaceBetween: 15,
            },
            640: {
              slidesPerView: 3,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 2.5,
              spaceBetween: 20,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 25,
            },
          },
        });
      }
    } catch (error) {
      console.error('Swiper initialization error:', error);
    }
  }

  ngOnInit() {
    this.generateMessages();
    this.loadPersistedData();
  }

  /**
   * Load persisted user status and period data from CycleSettingsService
   */
  private loadPersistedData() {
    // Load user status
    this.userStatus = this.cycleSettings.userStatus();
    this.isPregnant = this.cycleSettings.isPregnant();
    this.isPostpartum = this.cycleSettings.isPostpartum();
    
    // Load period data
    const lastPeriodStart = this.cycleSettings.lastPeriodStartDate();
    if (lastPeriodStart) {
      this.periodStartDate = new Date(lastPeriodStart);
      this.updateCycleDay();
    }
    
    // Load cycle settings
    this.periodLength = this.cycleSettings.periodLength();
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
    this.openDailyTracking();
  }

  viewCalendar() {
    this.openCalendarView();
  }

  // User Status Management
  async updateUserStatus() {
    const alert = await this.alertController.create({
      header: 'Update Your Status',
      message: 'Select your current status:',
      buttons: [
        {
          text: 'Trying to Conceive',
          handler: () => {
            this.userStatus = 'Trying to Conceive';
            this.isPregnant = false;
            this.isPostpartum = false;
            this.cycleSettings.setUserStatus('Trying to Conceive');
            this.cycleSettings.setPregnancyStatus(false);
            this.cycleSettings.setPostpartumStatus(false);
            this.showToast('Status updated to: Trying to Conceive');
          }
        },
        {
          text: 'Pregnant',
          handler: async () => {
            this.userStatus = 'Pregnant';
            this.isPregnant = true;
            this.isPostpartum = false;
            this.cycleSettings.setUserStatus('Pregnant');
            this.cycleSettings.setPregnancyStatus(true);
            this.cycleSettings.setPostpartumStatus(false);
            
            // Ask for pregnancy week
            const weekAlert = await this.alertController.create({
              header: '🎉 Congratulations!',
              message: 'What week of pregnancy are you in?',
              inputs: [
                {
                  name: 'week',
                  type: 'number',
                  placeholder: 'Enter week (4-40)',
                  min: 4,
                  max: 40,
                  value: 12
                }
              ],
              buttons: [
                {
                  text: 'Cancel',
                  role: 'cancel'
                },
                {
                  text: 'Set Week',
                  handler: (data) => {
                    const week = parseInt(data.week);
                    if (week >= 4 && week <= 40) {
                      this.updatePregnancyWeek(week);
                      const babyData = this.getCurrentBabySize();
                      this.showToast(`🎉 Week ${week}: Your baby is the size of a ${babyData.size.split(' ')[0]}!`);
                    } else {
                      this.showToast('Please enter a valid week (4-40)', 'warning');
                    }
                  }
                }
              ]
            });
            await weekAlert.present();
          }
        },
        {
          text: 'Postpartum',
          handler: async () => {
            this.userStatus = 'Postpartum';
            this.isPregnant = false;
            this.isPostpartum = true;
            this.cycleSettings.setUserStatus('Postpartum');
            this.cycleSettings.setPregnancyStatus(false);
            this.cycleSettings.setPostpartumStatus(true);
            
            // Ask for postpartum week
            const weekAlert = await this.alertController.create({
              header: '👶 Welcome to Postpartum!',
              message: 'How many weeks postpartum are you?',
              inputs: [
                {
                  name: 'week',
                  type: 'number',
                  placeholder: 'Enter week (1-12)',
                  min: 1,
                  max: 12,
                  value: 1
                }
              ],
              buttons: [
                {
                  text: 'Cancel',
                  role: 'cancel'
                },
                {
                  text: 'Set Week',
                  handler: (data) => {
                    const week = parseInt(data.week);
                    if (week >= 1 && week <= 12) {
                      this.updatePostpartumWeek(week);
                      const postpartumData = this.getCurrentPostpartumData();
                      this.showToast(`👶 Week ${week}: ${postpartumData.recovery} - You're doing amazing!`);
                    } else {
                      this.showToast('Please enter a valid week (1-12)', 'warning');
                    }
                  }
                }
              ]
            });
            await weekAlert.present();
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

  // Pregnancy Progress
  viewPregnancyDetails() {
    this.router.navigate(['/tabs/school']);
    this.showToast('Opening pregnancy week details...');
  }

  // Get current baby size data
  getCurrentBabySize() {
    const currentData = this.babySizeData.find(data => data.week === this.pregnancyWeek);
    if (currentData) {
      this.babySize = currentData.size;
      this.babyWeight = currentData.weight;
      return currentData;
    }
    return this.babySizeData[8]; // Default to week 12 (lime)
  }

  // Update pregnancy week and recalculate progress
  updatePregnancyWeek(week: number) {
    this.pregnancyWeek = week;
    this.pregnancyProgress = (week / 40) * 100;
    const babyData = this.getCurrentBabySize();
    this.babySize = babyData.size;
    this.babyWeight = babyData.weight;
  }

  // Get baby length based on week
  getBabyLength() {
    const lengths: { [key: number]: string } = {
      4: '0.04 inches',
      5: '0.13 inches',
      6: '0.25 inches',
      7: '0.5 inches',
      8: '0.63 inches',
      9: '0.9 inches',
      10: '1.22 inches',
      11: '1.61 inches',
      12: '2.13 inches',
      13: '2.91 inches',
      14: '3.42 inches',
      15: '3.98 inches',
      16: '4.57 inches',
      17: '5.12 inches',
      18: '5.59 inches',
      19: '6.02 inches',
      20: '6.46 inches',
      21: '10.51 inches',
      22: '10.94 inches',
      23: '11.38 inches',
      24: '11.81 inches',
      25: '13.62 inches',
      26: '14.02 inches',
      27: '14.41 inches',
      28: '14.80 inches',
      29: '15.2 inches',
      30: '15.71 inches',
      31: '16.18 inches',
      32: '16.69 inches',
      33: '17.20 inches',
      34: '17.72 inches',
      35: '18.19 inches',
      36: '18.66 inches',
      37: '19.13 inches',
      38: '19.61 inches',
      39: '19.96 inches',
      40: '20.16 inches'
    };
    return lengths[this.pregnancyWeek] || 'Growing...';
  }

  // Change week navigation
  changeWeek(direction: number) {
    const newWeek = this.pregnancyWeek + direction;
    if (newWeek >= 4 && newWeek <= 40) {
      this.updatePregnancyWeek(newWeek);
      this.showToast(`Week ${newWeek}: Your baby is now the size of a ${this.getCurrentBabySize().size.split(' ')[0]}! 🎉`);
    }
  }

  // Postpartum methods
  getCurrentPostpartumData() {
    const currentData = this.postpartumData.find(data => data.week === this.postpartumWeek);
    return currentData || this.postpartumData[0];
  }

  updatePostpartumWeek(week: number) {
    this.postpartumWeek = week;
    this.babyAge = `${week} week${week > 1 ? 's' : ''} old`;
    // Update baby stats based on week
    const weightGain = week * 0.2; // Approximate weight gain per week
    this.postpartumBabyWeight = `${(3.2 + weightGain).toFixed(1)}kg`;
    const lengthGain = week * 0.5; // Approximate length gain per week
    this.postpartumBabyLength = `${(50 + lengthGain).toFixed(0)}cm`;
  }

  changePostpartumWeek(direction: number) {
    const newWeek = this.postpartumWeek + direction;
    if (newWeek >= 1 && newWeek <= 12) {
      this.updatePostpartumWeek(newWeek);
      const postpartumData = this.getCurrentPostpartumData();
      this.showToast(`Week ${newWeek}: ${postpartumData.recovery} - ${postpartumData.tips} 💕`);
    }
  }

  // Get baby milestones based on age
  getBabyMilestones() {
    const milestones: { [key: number]: string[] } = {
      1: ['Lifts head briefly', 'Responds to sounds', 'Makes eye contact'],
      2: ['Follows objects with eyes', 'Makes cooing sounds', 'Smiles responsively'],
      3: ['Holds head up longer', 'Reaches for objects', 'Laughs out loud'],
      4: ['Rolls from tummy to back', 'Grasps objects', 'Babbles more'],
      5: ['Sits with support', 'Recognizes familiar faces', 'Shows excitement'],
      6: ['Rolls both ways', 'Passes objects between hands', 'Responds to name'],
      8: ['Sits without support', 'Crawls or scoots', 'Says "mama" or "dada"'],
      12: ['Pulls to stand', 'Takes first steps', 'Says first words']
    };
    return milestones[this.postpartumWeek] || ['Growing and developing beautifully!'];
  }

  // Appointment Management
  async rescheduleAppointment(appointment: any) {
    const alert = await this.alertController.create({
      header: 'Reschedule Appointment',
      message: `Reschedule ${appointment.title} with ${appointment.doctor}?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Reschedule',
          handler: () => {
            this.router.navigate(['/tabs/consultation']);
            this.showToast('Opening appointment booking...');
          }
        }
      ]
    });
    await alert.present();
  }

  async cancelAppointment(appointment: any) {
    const alert = await this.alertController.create({
      header: 'Cancel Appointment',
      message: `Are you sure you want to cancel ${appointment.title}?`,
      buttons: [
        {
          text: 'No',
          role: 'cancel'
        },
        {
          text: 'Yes, Cancel',
          handler: () => {
            this.upcomingAppointments = this.upcomingAppointments.filter(
              apt => apt !== appointment
            );
            this.showToast('Appointment cancelled');
          }
        }
      ]
    });
    await alert.present();
  }

  bookNewAppointment() {
    this.router.navigate(['/tabs/consultation']);
    this.showToast('Opening appointment booking...');
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
      case 'feeding':
        await this.openFeedingTracker();
        break;
      case 'sleep':
        await this.openSleepTracker();
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
          text: '🤖 Chat with Assistant',
          handler: () => {
            this.router.navigate(['/chatbot']);
          }
        },
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
            this.router.navigate(['tabs/tools']);
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

  // Postpartum-specific methods
  async openFeedingTracker() {
    try {
      await this.showToast('Opening feeding tracker...', 'success');
      
      const feedingAlert = await this.alertController.create({
        header: '🍼 Feeding Tracker',
        message: 'Track your baby\'s feeding schedule, duration, and patterns to ensure proper nutrition.',
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

      await feedingAlert.present();
      
    } catch (error) {
      await this.showToast('Failed to open feeding tracker. Please try again.', 'danger');
    }
  }

  async openSleepTracker() {
    try {
      await this.showToast('Opening sleep tracker...', 'success');
      
      const sleepAlert = await this.alertController.create({
        header: '😴 Sleep Tracker',
        message: 'Monitor your baby\'s sleep patterns, duration, and quality to establish healthy sleep habits.',
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

      await sleepAlert.present();
      
    } catch (error) {
      await this.showToast('Failed to open sleep tracker. Please try again.', 'danger');
    }
  }

  // Helper methods for pregnancy tracker
  getWeeksArray(): number[] {
    return Array.from({length: 40}, (_, i) => i + 1);
  }
  
  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
  


  // Open period date picker modal
  async openPeriodDatePicker() {
    const modal = await this.modalController.create({
      component: PeriodDatePickerPageComponent,
      componentProps: {},
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      backdropDismiss: false
    });

    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.onPeriodDateSelected(data);
    }
  }

  // Handle period date selection from the date picker modal
  onPeriodDateSelected(periodRange: PeriodDateRange) {
    console.log('Period date selected:', periodRange);
    this.showToast('Period logged successfully!', 'success');
    
    // Update user status to "Trying to Conceive" to show the period chart
    this.userStatus = 'Trying to Conceive';
    this.isPregnant = false;
    this.isPostpartum = false;
    
    // Set the period start date and update cycle day
    this.periodStartDate = periodRange.startDate;
    this.updateCycleDay();
    
    // Save to persistent storage
    this.cycleSettings.setUserStatus('Trying to Conceive');
    this.cycleSettings.setPregnancyStatus(false);
    this.cycleSettings.setPostpartumStatus(false);
    this.cycleSettings.setLastPeriodStart(periodRange.startDate.toISOString().split('T')[0]);
  }
  
  showPregnancyDetails() {
    this.viewPregnancyDetails();
  }
  
  getWeekDays(): any[] {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const days = [];
    
    // Get the start of the current week (Sunday)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      
      days.push({
        date: dayDate.getDate(),
        isSelected: dayDate.getDate() === today.getDate() && 
                   dayDate.getMonth() === today.getMonth() &&
                   dayDate.getFullYear() === today.getFullYear(),
        fullDate: dayDate
      });
    }
    
    return days;
  }
  
  selectDay(day: any) {
    // Update all days to not selected
    this.getWeekDays().forEach(d => d.isSelected = false);
    
    // Set the clicked day as selected
    day.isSelected = true;
    
    // Calculate pregnancy progress based on selected date
    const selectedDate = day.fullDate;
    const pregnancyStartDate = new Date(this.pregnancyStartDate);
    const diffTime = Math.abs(selectedDate.getTime() - pregnancyStartDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    this.pregnancyDays = diffDays;
    this.pregnancyWeek = Math.floor(diffDays / 7);
    this.pregnancyProgress = (this.pregnancyWeek / 40) * 100;
    
    // Update baby size data
    this.updateBabySize();
  }
  
  getWeeksForDisplay(): any[][] {
    const weeks = [];
    const today = new Date();
    
    // Generate 8 weeks (4 weeks before current + current week + 3 weeks after)
    for (let weekOffset = -4; weekOffset <= 3; weekOffset++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + (weekOffset * 7));
      
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + i);
        
        weekDays.push({
          date: dayDate.getDate(),
          isSelected: dayDate.getDate() === today.getDate() && 
                     dayDate.getMonth() === today.getMonth() &&
                     dayDate.getFullYear() === today.getFullYear(),
          isToday: dayDate.getDate() === today.getDate() && 
                   dayDate.getMonth() === today.getMonth() &&
                   dayDate.getFullYear() === today.getFullYear(),
          fullDate: dayDate
        });
      }
      weeks.push(weekDays);
    }
    
    return weeks;
  }
  
  previousWeek() {
    this.currentWeekOffset--;
    // Trigger change detection
    this.getWeeksForDisplay();
  }
  
  nextWeek() {
    this.currentWeekOffset++;
    // Trigger change detection
    this.getWeeksForDisplay();
  }
  
  selectWeek(week: number) {
    this.pregnancyWeek = week;
    this.pregnancyProgress = (week / 40) * 100;
    this.pregnancyDays = week * 7;
    this.updateBabySize();
    
    // Calculate the start date based on selected week
    const today = new Date();
    const daysToSubtract = this.pregnancyDays;
    const startDate = new Date(today.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000));
    this.pregnancyStartDate = startDate.toISOString().split('T')[0];
  }
  
  onDateChange(event: any) {
    const selectedDate = new Date(event.detail.value);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - selectedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    this.pregnancyDays = diffDays;
    this.pregnancyWeek = Math.floor(diffDays / 7);
    this.pregnancyProgress = (this.pregnancyWeek / 40) * 100;
    
    // Update baby size data
    this.updateBabySize();
  }
  
  getBabyDevelopment(week: number): string {
    // Realistic baby development stages with more detail
    if (week <= 4) return '🥚'; // Fertilized egg
    if (week <= 8) return '🫘'; // Embryo
    if (week <= 12) return '👶'; // Early fetus
    if (week <= 16) return '👶'; // Developing fetus
    if (week <= 20) return '👶'; // More developed fetus
    if (week <= 24) return '👶'; // Viable fetus
    if (week <= 28) return '👶'; // Growing fetus
    if (week <= 32) return '👶'; // Almost full term
    if (week <= 36) return '👶'; // Near term
    return '👶'; // Full term
  }
  
  getBabyEmoji(week: number): string {
    const emojis = [
      '🌱', '🌱', '🌱', '🌱', // Weeks 1-4
      '🫘', '🫘', '🫘', '🫘', // Weeks 5-8
      '🫐', '🫐', '🫐', '🫐', // Weeks 9-12
      '🍊', '🍊', '🍊', '🍊', // Weeks 13-16
      '🍑', '🍑', '🍑', '🍑', // Weeks 17-20
      '🍎', '🍎', '🍎', '🍎', // Weeks 21-24
      '🥑', '🥑', '🥑', '🥑', // Weeks 25-28
      '🍐', '🍐', '🍐', '🍐', // Weeks 29-32
      '🎃', '🎃', '🎃', '🎃', // Weeks 33-36
      '🍉', '🍉', '🍉', '🍉'  // Weeks 37-40
    ];
    
    return emojis[Math.min(week - 1, emojis.length - 1)] || '👶';
  }
  
  updateBabySize() {
    const babyData = this.babySizeData.find(data => data.week === this.pregnancyWeek);
    if (babyData) {
      this.babySize = babyData.size;
      this.babyWeight = babyData.weight;
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

  // Cycle day methods
  getCycleDayStatus(): string {
    if (this.currentCycleDay <= 0) return 'Not tracking';
    if (this.currentCycleDay <= this.periodLength) return 'Period Day';
    if (this.currentCycleDay <= 14) return 'Follicular Phase';
    if (this.currentCycleDay <= 28) return 'Luteal Phase';
    return 'Next Cycle';
  }

  getCycleDayDescription(): string {
    if (this.currentCycleDay <= 0) return 'Start tracking your cycle';
    if (this.currentCycleDay <= this.periodLength) return `Day ${this.currentCycleDay} of your period`;
    if (this.currentCycleDay <= 14) return 'Your body is preparing for ovulation';
    if (this.currentCycleDay <= 28) return 'Your body is preparing for the next period';
    return 'Time to start tracking your next cycle';
  }

  updateCycleDay() {
    if (!this.periodStartDate) {
      this.currentCycleDay = 0;
      return;
    }

    const today = new Date();
    const startDate = new Date(this.periodStartDate);
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    this.currentCycleDay = diffDays + 1; // +1 because day 1 is the start date
  }
}
