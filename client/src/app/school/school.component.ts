import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, inject } from '@angular/core';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { CycleSettingsService } from '../shared/services/cycle-settings.service';
import { BabyDevelopmentService } from '../shared/services/baby-development.service';

@Component({
  selector: 'app-school',
  templateUrl: './school.component.html',
  styleUrls: ['./school.component.scss'],
  standalone: true,
  imports:[...SHARED_STANDALONE_IMPORTS],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class SchoolComponent implements OnInit {
  private cycleSettings = inject(CycleSettingsService);
  private babyDevelopmentService = inject(BabyDevelopmentService);

  // Pregnancy data
  pregnancyWeek: number = 12;
  isPregnant: boolean = false;
  currentBaby: any = null;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.loadPregnancyData();
  }

  /**
   * Load pregnancy data from services
   */
  private loadPregnancyData() {
    this.isPregnant = this.cycleSettings.isPregnant();
    this.pregnancyWeek = this.cycleSettings.pregnancyWeek();
    
    if (this.isPregnant) {
      this.currentBaby = this.babyDevelopmentService.getCurrentBabySize();
    }
  }

  /**
   * Get baby development facts for specific week
   */
  getBabyDevelopmentFacts(week: number): string {
    const facts: { [key: number]: string } = {
      4: "Your baby is just a tiny ball of cells called a blastocyst, but the foundation for everything is being laid!",
      5: "The heart is beginning to form and will start beating soon. The neural tube (which becomes the brain and spinal cord) is developing.",
      6: "Your baby's heart is now beating! The eyes, ears, and mouth are starting to form. The baby is about the size of a lentil.",
      7: "The baby's arms and legs are beginning to form as tiny buds. The brain is developing rapidly with 100 new brain cells every minute!",
      8: "Fingers and toes are starting to form! The baby's facial features are becoming more defined. The tail is disappearing.",
      9: "All major organs are in place and starting to function. The baby can now move, though you won't feel it yet.",
      10: "The baby's bones are starting to harden. The baby can now make a fist and has individual fingers and toes.",
      11: "The baby is starting to look more human! The head is about half the size of the body. The baby can now swallow and make breathing movements.",
      12: "The baby's reflexes are developing. The baby can now make facial expressions and may even suck their thumb!",
      13: "The baby's vocal cords are developing. The baby can now hear sounds from outside the womb.",
      14: "The baby's fingerprints are forming! The baby can now make facial expressions and may even smile.",
      15: "The baby's bones are getting stronger. The baby can now make coordinated movements and may even kick!",
      16: "The baby's eyes can now move and detect light. The baby's taste buds are developing.",
      17: "The baby's hearing is improving. The baby can now hear your heartbeat and voice!",
      18: "The baby's movements are becoming more coordinated. The baby can now yawn and hiccup.",
      19: "The baby's brain is developing rapidly. The baby can now respond to touch and may even grab the umbilical cord.",
      20: "The baby is halfway through pregnancy! The baby can now hear and respond to sounds from outside the womb.",
      21: "The baby's digestive system is developing. The baby can now taste the amniotic fluid.",
      22: "The baby's sense of touch is developing. The baby can now feel when you touch your belly.",
      23: "The baby's lungs are developing rapidly. The baby can now make breathing movements.",
      24: "The baby's eyes are fully formed and can now open and close. The baby can see light filtering through the womb.",
      25: "The baby's brain is developing rapidly. The baby can now dream and have sleep cycles.",
      26: "The baby's lungs are producing surfactant, which helps them breathe after birth.",
      27: "The baby's immune system is developing. The baby can now respond to your voice and may even recognize it.",
      28: "The baby's eyes can now focus and track light. The baby can now distinguish between different sounds.",
      29: "The baby's bones are fully formed but still soft. The baby can now make coordinated movements.",
      30: "The baby's brain is developing rapidly. The baby can now learn and remember sounds from outside the womb.",
      31: "The baby's lungs are almost fully developed. The baby can now practice breathing movements.",
      32: "The baby's skin is becoming less transparent. The baby can now make facial expressions.",
      33: "The baby's immune system is getting stronger. The baby can now respond to your touch.",
      34: "The baby's lungs are fully developed. The baby can now breathe on their own if born early.",
      35: "The baby's brain is developing rapidly. The baby can now learn and remember patterns.",
      36: "The baby's head is now in position for birth. The baby can now make coordinated movements.",
      37: "The baby is considered full-term! The baby can now survive outside the womb with minimal support.",
      38: "The baby's brain is developing rapidly. The baby can now learn and remember sounds.",
      39: "The baby's lungs are fully developed. The baby can now breathe on their own.",
      40: "The baby is ready to be born! The baby can now survive outside the womb with full support."
    };

    return facts[week] || "Your baby is growing and developing beautifully! Each week brings new milestones and amazing changes.";
  }

  /**
   * Get fun facts about baby development
   */
  getFunFacts(week: number): string {
    const funFacts: { [key: number]: string } = {
      4: "At this stage, your baby is smaller than a grain of rice!",
      5: "Your baby's heart will beat about 100,000 times a day!",
      6: "Your baby's heart beats twice as fast as yours!",
      7: "Your baby is developing at an incredible rate - about 1 million new cells every minute!",
      8: "Your baby's fingerprints are already forming and will be unique!",
      9: "Your baby can now make tiny movements, though you won't feel them yet!",
      10: "Your baby's brain is growing at an amazing rate - about 250,000 new neurons every minute!",
      11: "Your baby can now swallow and may even suck their thumb!",
      12: "Your baby's reflexes are developing - they can now make a fist!",
      13: "Your baby can now hear sounds from outside the womb!",
      14: "Your baby's fingerprints are fully formed and unique!",
      15: "Your baby can now make facial expressions and may even smile!",
      16: "Your baby's taste buds are developing and can taste the amniotic fluid!",
      17: "Your baby can now hear your heartbeat and voice!",
      18: "Your baby can now yawn and hiccup!",
      19: "Your baby can now respond to touch and may even grab the umbilical cord!",
      20: "Your baby is halfway through pregnancy and can now hear and respond to sounds!",
      21: "Your baby can now taste the amniotic fluid and may have food preferences!",
      22: "Your baby can now feel when you touch your belly!",
      23: "Your baby can now make breathing movements!",
      24: "Your baby's eyes can now open and close and can see light!",
      25: "Your baby can now dream and have sleep cycles!",
      26: "Your baby can now respond to your voice and may even recognize it!",
      27: "Your baby can now distinguish between different sounds!",
      28: "Your baby can now focus and track light!",
      29: "Your baby can now make coordinated movements!",
      30: "Your baby can now learn and remember sounds from outside the womb!",
      31: "Your baby can now practice breathing movements!",
      32: "Your baby can now make facial expressions!",
      33: "Your baby can now respond to your touch!",
      34: "Your baby can now breathe on their own if born early!",
      35: "Your baby can now learn and remember patterns!",
      36: "Your baby can now make coordinated movements!",
      37: "Your baby is considered full-term and can survive outside the womb!",
      38: "Your baby can now learn and remember sounds!",
      39: "Your baby can now breathe on their own!",
      40: "Your baby is ready to be born and can survive outside the womb!"
    };

    return funFacts[week] || "Your baby is growing and developing beautifully! Each week brings new milestones and amazing changes.";
  }

  /**
   * Get baby length based on week
   */
  getBabyLength(): string {
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

  /**
   * Navigate to previous week
   */
  previousWeek() {
    if (this.pregnancyWeek > 4) {
      this.pregnancyWeek--;
      this.currentBaby = this.babyDevelopmentService.getCurrentBabySize();
    }
  }

  /**
   * Navigate to next week
   */
  nextWeek() {
    if (this.pregnancyWeek < 40) {
      this.pregnancyWeek++;
      this.currentBaby = this.babyDevelopmentService.getCurrentBabySize();
    }
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(): number {
    return Math.round((this.pregnancyWeek / 40) * 100);
  }

  /**
   * Navigate to home
   */
  goToHome() {
    this.router.navigate(['/tabs/home']);
  }

  // Course Enrollment
  async enrollCourse(courseId: string) {
    const courses = {
      'pregnancy-basics': { name: 'Pregnancy Basics 101', instructor: 'Dr. Sarah Johnson' },
      'nutrition': { name: 'Pregnancy Nutrition Guide', instructor: 'Dr. Sarah Johnson' },
      'exercise': { name: 'Safe Pregnancy Exercises', instructor: 'Dr. Emily Rodriguez' },
      'mental-health': { name: 'Mental Wellness During Pregnancy', instructor: 'Dr. Lisa Chen' },
      'baby-care': { name: 'Newborn Care Essentials', instructor: 'Dr. Maria Garcia' }
    };

    const course = courses[courseId as keyof typeof courses];
    
    const alert = await this.alertController.create({
      header: `Enroll in ${course.name}`,
      message: `Instructor: ${course.instructor}\n\nThis course is completely free and includes:\n• Video lessons\n• Interactive quizzes\n• Downloadable resources\n• Certificate upon completion\n\nWould you like to enroll?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Enroll Now',
          handler: () => {
            this.showEnrollmentConfirmation(course.name);
          }
        }
      ]
    });

    await alert.present();
  }

  // Category Browsing
  async browseCategory(categoryId: string) {
    const categories = {
      'health': { name: 'Health & Wellness', count: 8 },
      'nutrition': { name: 'Nutrition', count: 6 },
      'fitness': { name: 'Exercise', count: 5 },
      'mental': { name: 'Mental Health', count: 4 },
      'baby': { name: 'Baby Care', count: 7 },
      'parenting': { name: 'Parenting', count: 6 }
    };

    const category = categories[categoryId as keyof typeof categories];
    
    const alert = await this.alertController.create({
      header: category.name,
      message: `Browse ${category.count} courses in ${category.name}:\n\n• Course 1: Introduction to...\n• Course 2: Advanced...\n• Course 3: Specialized...\n\nWould you like to see all courses in this category?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Browse Courses',
          handler: () => {
            this.showToast(`Opening ${category.name} courses...`, 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  // Learning Paths
  async continuePath(pathId: string) {
    const paths = {
      'first-time': { name: 'First-Time Mother Path', progress: '8/12' },
      'active': { name: 'Active Pregnancy Path', progress: '5/8' },
      'nutrition': { name: 'Nutrition Mastery Path', progress: '3/6' }
    };

    const path = paths[pathId as keyof typeof paths];
    
    const alert = await this.alertController.create({
      header: path.name,
      message: `Progress: ${path.progress} courses completed\n\nContinue your learning journey:\n• Next course: Advanced...\n• Estimated time: 2 hours\n• Difficulty: Intermediate\n\nWould you like to continue?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Continue Learning',
          handler: () => {
            this.showToast(`Continuing ${path.name}...`, 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  // Certificate Viewing
  async viewCertificate(certificateId: string) {
    const certificates = {
      'nutrition': { name: 'Pregnancy Nutrition Expert', date: 'March 15, 2024' },
      'fitness': { name: 'Prenatal Fitness Specialist', date: 'February 28, 2024' },
      'mental': { name: 'Mental Wellness Advocate', date: 'January 20, 2024' }
    };

    const certificate = certificates[certificateId as keyof typeof certificates];
    
    const alert = await this.alertController.create({
      header: certificate.name,
      message: `Earned on ${certificate.date}\n\nThis certificate recognizes your completion of specialized courses with distinction.\n\nYou can:\n• Download PDF certificate\n• Share on social media\n• Add to your profile\n\nWould you like to download your certificate?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Download Certificate',
          handler: () => {
            this.showToast('Downloading certificate...', 'success');
          }
        },
        {
          text: 'Share Certificate',
          handler: () => {
            this.showToast('Sharing certificate...', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  // Quick Menu
  async openQuickMenu() {
    const actionSheet = await this.alertController.create({
      header: 'Quick Actions',
      buttons: [
        {
          text: '📚 Browse All Courses',
          handler: () => {
            this.showToast('Opening course catalog...', 'success');
          }
        },
        {
          text: '📊 View Progress',
          handler: () => {
            this.showToast('Opening progress dashboard...', 'success');
          }
        },
        {
          text: '🏆 My Certificates',
          handler: () => {
            this.showToast('Opening certificates...', 'success');
          }
        },
        {
          text: '📞 Contact Support',
          handler: () => {
            this.showToast('Opening support chat...', 'success');
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

  // Notifications
  async openNotifications() {
    const alert = await this.alertController.create({
      header: 'Notifications',
      message: 'You have 3 new notifications:\n\n• New course available: "Advanced Nutrition"\n• Course reminder: "Pregnancy Basics" lesson 3\n• Certificate earned: "Mental Wellness Advocate"\n\nWould you like to view all notifications?',
      buttons: [
        {
          text: 'View All',
          handler: () => {
            this.showToast('Opening notifications...', 'success');
          }
        },
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }

  // Utility Methods
  async showEnrollmentConfirmation(courseName: string) {
    const alert = await this.alertController.create({
      header: '✅ Successfully Enrolled!',
      message: `You are now enrolled in "${courseName}".\n\nYou can start learning immediately:\n• Access course materials\n• Watch video lessons\n• Take quizzes\n• Track your progress\n\nWould you like to start the first lesson now?`,
      buttons: [
        {
          text: 'Start Learning',
          handler: () => {
            this.showToast('Opening first lesson...', 'success');
          }
        },
        {
          text: 'Later',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
    await this.showToast('Successfully enrolled in course!', 'success');
  }

  async showToast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }

  /** Pull-to-refresh on School tab (layout). */
  async runPullToRefresh(): Promise<void> {
    this.loadPregnancyData();
  }
}
