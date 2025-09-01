import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-school',
  templateUrl: './school.component.html',
  styleUrls: ['./school.component.scss'],
  standalone: true,
  imports:[SharedModule],
  schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class SchoolComponent implements OnInit {

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {}

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
}
