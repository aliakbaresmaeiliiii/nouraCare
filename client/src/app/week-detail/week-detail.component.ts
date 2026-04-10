import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { SHARED_STANDALONE_IMPORTS } from '../shared/shared-standalone';
import { OnboardingService } from '../shared/services/onboarding.service';

interface WeekData {
  week: number;
  title: string;
  babySize: string;
  babyWeight: string;
  babyLength: string;
  development: string[];
  symptoms: string[];
  nutrition: {
    foods: string[];
    avoid: string[];
    supplements: string[];
  };
  activities: {
    exercise: string[];
    relaxation: string[];
    preparation: string[];
  };
  intimacy: {
    safe: boolean;
    tips: string[];
    positions: string[];
  };
  medical: {
    appointments: string[];
    tests: string[];
    concerns: string[];
  };
  tips: string[];
  funFacts: string[];
}

@Component({
  selector: 'app-week-detail',
  templateUrl: './week-detail.component.html',
  styleUrls: ['./week-detail.component.scss'],
  standalone: true,
  imports: [...SHARED_STANDALONE_IMPORTS]
})
export class WeekDetailComponent implements OnInit {
  private navCtrl = inject(NavController);
  private route = inject(ActivatedRoute);
  private toastController = inject(ToastController);
  private onboardingService = inject(OnboardingService);

  pregnancyWeek: number = 4;
  weekData: WeekData | null = null;
  activeTab: string = 'development';
  isSavingWeek = false;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const fromQuery = parseInt(params['week']);
      this.pregnancyWeek = Number.isFinite(fromQuery)
        ? Math.min(40, Math.max(4, fromQuery))
        : 4;
      this.loadWeekData();
    });

    this.onboardingService.getDashboard().subscribe({
      next: (dashboard) => {
        if (dashboard.state === 'pregnant' && dashboard.week) {
          this.pregnancyWeek = Math.min(40, Math.max(4, dashboard.week));
          this.loadWeekData();
        }
      },
    });
  }

  loadWeekData() {
    this.weekData = this.getWeekData(this.pregnancyWeek);
  }

  previousWeek() {
    if (this.pregnancyWeek > 4) {
      this.pregnancyWeek--;
      this.loadWeekData();
      this.scrollToTop();
    }
  }

  nextWeek() {
    if (this.pregnancyWeek < 40) {
      this.pregnancyWeek++;
      this.loadWeekData();
      this.scrollToTop();
    }
  }

  scrollToTop() {
    const content = document.querySelector('ion-content');
    if (content) {
      content.scrollToTop(300);
    }
  }

  setActiveTab(tab: any) {
    const detail  = tab.detail.value;
    this.activeTab = detail;
  }

  goBack() {
    this.navCtrl.back();
  }

  onWeekRangeChange(event: any) {
    const value = Number(event?.detail?.value);
    if (!Number.isFinite(value)) {
      return;
    }
    this.pregnancyWeek = Math.min(40, Math.max(4, Math.round(value)));
    this.loadWeekData();
  }

  async saveWeek() {
    if (this.isSavingWeek) {
      return;
    }
    this.isSavingWeek = true;
    const pregnancyStartDate = this.estimatePregnancyStartDate(this.pregnancyWeek);

    this.onboardingService
      .updateReproductiveState({
        state: 'pregnant',
        currentWeek: this.pregnancyWeek,
        pregnancyStartDate,
      })
      .subscribe({
        next: async () => {
          this.isSavingWeek = false;
          await this.showToast(`Saved week ${this.pregnancyWeek}`);
        },
        error: async () => {
          this.isSavingWeek = false;
          await this.showToast('Could not save pregnancy week. Try again.');
        },
      });
  }

  private estimatePregnancyStartDate(week: number): string {
    const now = new Date();
    const daysBack = Math.max(0, (week - 1) * 7);
    now.setDate(now.getDate() - daysBack);
    return now.toISOString().split('T')[0];
  }

  async showToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom'
    });
    await toast.present();
  }

  getWeekData(week: number): WeekData {
    const weekDataMap: { [key: number]: WeekData } = {
      1: {
        week: 1,
        title: "Conception Week",
        babySize: "Pinhead",
        babyWeight: "0.1g",
        babyLength: "0.1mm",
        development: [
          "Fertilization occurs",
          "Cell division begins",
          "Blastocyst forms"
        ],
        symptoms: [
          "No symptoms yet",
          "Normal menstrual cycle",
          "Possible implantation spotting"
        ],
        nutrition: {
          foods: ["Folic acid rich foods", "Leafy greens", "Citrus fruits", "Whole grains"],
          avoid: ["Raw fish", "Unpasteurized dairy", "Excessive caffeine"],
          supplements: ["Folic acid (400-800mcg)", "Prenatal vitamins"]
        },
        activities: {
          exercise: ["Light walking", "Gentle stretching", "Yoga"],
          relaxation: ["Meditation", "Deep breathing", "Reading"],
          preparation: ["Start prenatal vitamins", "Track ovulation", "Healthy lifestyle"]
        },
        intimacy: {
          safe: true,
          tips: ["Normal sexual activity", "Communicate with partner", "Enjoy intimacy"],
          positions: ["Any comfortable position", "Listen to your body"]
        },
        medical: {
          appointments: ["Preconception checkup", "Genetic counseling if needed"],
          tests: ["Blood work", "Pap smear", "STD screening"],
          concerns: ["Family history", "Medications", "Lifestyle factors"]
        },
        tips: [
          "Start taking folic acid",
          "Maintain healthy diet",
          "Avoid alcohol and smoking",
          "Stay hydrated"
        ],
        funFacts: [
          "Your baby is smaller than a grain of rice",
          "The journey of 40 weeks begins now",
          "Every pregnancy is unique"
        ]
      },
      8: {
        week: 8,
        title: "Rapid Development",
        babySize: "Raspberry",
        babyWeight: "1g",
        babyLength: "1.6cm",
        development: [
          "Heart beats regularly",
          "Arms and legs forming",
          "Facial features developing",
          "Neural tube closes"
        ],
        symptoms: [
          "Morning sickness peaks",
          "Breast tenderness",
          "Fatigue",
          "Frequent urination",
          "Food aversions"
        ],
        nutrition: {
          foods: ["Small frequent meals", "Ginger tea", "Crackers", "Protein-rich foods", "Iron-rich foods"],
          avoid: ["Large meals", "Spicy foods", "Strong odors", "Empty stomach"],
          supplements: ["Prenatal vitamins", "Iron if needed", "Vitamin D"]
        },
        activities: {
          exercise: ["Gentle walking", "Prenatal yoga", "Swimming"],
          relaxation: ["Rest when tired", "Short naps", "Stress management"],
          preparation: ["First prenatal appointment", "Choose healthcare provider"]
        },
        intimacy: {
          safe: true,
          tips: ["Communicate about comfort", "Gentle approach", "Listen to your body"],
          positions: ["Side-lying", "Gentle missionary", "Spooning"]
        },
        medical: {
          appointments: ["First prenatal visit", "Ultrasound", "Blood tests"],
          tests: ["Pregnancy confirmation", "Blood type", "Rh factor"],
          concerns: ["Bleeding", "Severe nausea", "Abdominal pain"]
        },
        tips: [
          "Eat small frequent meals",
          "Stay hydrated",
          "Get plenty of rest",
          "Avoid strong smells"
        ],
        funFacts: [
          "Baby's heart beats 150-170 times per minute",
          "All major organs are forming",
          "Baby can move arms and legs"
        ]
      },
      12: {
        week: 12,
        title: "End of First Trimester",
        babySize: "Lime",
        babyWeight: "14g",
        babyLength: "5.4cm",
        development: [
          "All organs formed",
          "Fingers and toes visible",
          "Reflexes developing",
          "Sex organs forming"
        ],
        symptoms: [
          "Morning sickness may improve",
          "Energy levels increase",
          "Breast changes continue",
          "Mood swings",
          "Increased appetite"
        ],
        nutrition: {
          foods: ["Balanced meals", "Fresh fruits", "Vegetables", "Lean proteins", "Dairy products"],
          avoid: ["Raw seafood", "Soft cheeses", "Deli meats", "Excessive sugar"],
          supplements: ["Prenatal vitamins", "Omega-3", "Calcium"]
        },
        activities: {
          exercise: ["Regular walking", "Prenatal fitness", "Swimming", "Low-impact aerobics"],
          relaxation: ["Prenatal massage", "Meditation", "Reading"],
          preparation: ["Announce pregnancy", "Plan maternity leave", "Research baby gear"]
        },
        intimacy: {
          safe: true,
          tips: ["Increased energy may improve libido", "Communicate openly", "Enjoy this phase"],
          positions: ["Any comfortable position", "Experiment gently", "Focus on connection"]
        },
        medical: {
          appointments: ["Regular prenatal visits", "Nuchal translucency scan"],
          tests: ["Genetic screening", "Blood pressure", "Weight check"],
          concerns: ["Any unusual symptoms", "Bleeding", "Severe pain"]
        },
        tips: [
          "Energy levels should improve",
          "Start planning nursery",
          "Begin gentle exercise routine",
          "Stay hydrated"
        ],
        funFacts: [
          "Baby can make facial expressions",
          "All major organs are functioning",
          "Risk of miscarriage drops significantly"
        ]
      },
      20: {
        week: 20,
        title: "Halfway Point",
        babySize: "Banana",
        babyWeight: "300g",
        babyLength: "16.4cm",
        development: [
          "Hair starts growing",
          "Vernix caseosa forms",
          "Baby can hear",
          "Regular sleep cycles"
        ],
        symptoms: [
          "Baby movements felt",
          "Back pain",
          "Leg cramps",
          "Heartburn",
          "Nasal congestion"
        ],
        nutrition: {
          foods: ["Calcium-rich foods", "Iron-rich foods", "Protein", "Fiber", "Omega-3"],
          avoid: ["Excessive sodium", "Processed foods", "Caffeine", "Alcohol"],
          supplements: ["Prenatal vitamins", "Calcium", "Iron", "DHA"]
        },
        activities: {
          exercise: ["Prenatal yoga", "Swimming", "Walking", "Pelvic floor exercises"],
          relaxation: ["Prenatal massage", "Warm baths", "Meditation"],
          preparation: ["Anatomy scan", "Register for classes", "Plan baby shower"]
        },
        intimacy: {
          safe: true,
          tips: ["Increased blood flow", "Communicate about comfort", "Gentle approach"],
          positions: ["Side-lying", "Spooning", "Modified missionary"]
        },
        medical: {
          appointments: ["Anatomy ultrasound", "Regular checkups"],
          tests: ["Detailed anatomy scan", "Glucose screening prep"],
          concerns: ["Decreased movement", "Severe swelling", "Headaches"]
        },
        tips: [
          "Start feeling baby movements",
          "Sleep on your side",
          "Stay active",
          "Eat balanced meals"
        ],
        funFacts: [
          "Baby can hear your voice",
          "Halfway through pregnancy",
          "Baby sleeps 12-14 hours daily"
        ]
      },
      28: {
        week: 28,
        title: "Third Trimester Begins",
        babySize: "Eggplant",
        babyWeight: "1kg",
        babyLength: "37.6cm",
        development: [
          "Eyes can open",
          "Brain developing rapidly",
          "Lungs maturing",
          "Fat deposits forming"
        ],
        symptoms: [
          "Increased baby movements",
          "Shortness of breath",
          "Swelling",
          "Braxton Hicks contractions",
          "Sleep difficulties"
        ],
        nutrition: {
          foods: ["Small frequent meals", "High-fiber foods", "Iron-rich foods", "Calcium", "Protein"],
          avoid: ["Large meals", "Excessive sodium", "Processed foods", "Caffeine"],
          supplements: ["Prenatal vitamins", "Iron", "Calcium", "DHA"]
        },
        activities: {
          exercise: ["Gentle walking", "Prenatal yoga", "Swimming", "Pelvic tilts"],
          relaxation: ["Prenatal massage", "Warm baths", "Meditation"],
          preparation: ["Hospital bag", "Birth plan", "Childbirth classes"]
        },
        intimacy: {
          safe: true,
          tips: ["Communicate about comfort", "Gentle approach", "Listen to your body"],
          positions: ["Side-lying", "Spooning", "Sitting positions"]
        },
        medical: {
          appointments: ["Bi-weekly visits", "Glucose tolerance test"],
          tests: ["Glucose screening", "Rh antibody test", "Group B strep"],
          concerns: ["Preterm labor signs", "High blood pressure", "Gestational diabetes"]
        },
        tips: [
          "Monitor baby movements",
          "Sleep on your left side",
          "Stay hydrated",
          "Prepare for birth"
        ],
        funFacts: [
          "Baby can recognize your voice",
          "Rapid brain development",
          "Baby practices breathing"
        ]
      },
      36: {
        week: 36,
        title: "Almost There",
        babySize: "Head of Lettuce",
        babyWeight: "2.6kg",
        babyLength: "47.4cm",
        development: [
          "Lungs fully mature",
          "Immune system developing",
          "Baby positions for birth",
          "Vernix thickens"
        ],
        symptoms: [
          "Baby drops lower",
          "Increased pressure",
          "Frequent urination",
          "Nesting instinct",
          "Back pain"
        ],
        nutrition: {
          foods: ["Small frequent meals", "High-protein foods", "Complex carbs", "Healthy fats"],
          avoid: ["Large meals", "Spicy foods", "Excessive sodium", "Caffeine"],
          supplements: ["Prenatal vitamins", "Iron", "Calcium", "DHA"]
        },
        activities: {
          exercise: ["Gentle walking", "Pelvic floor exercises", "Prenatal yoga", "Swimming"],
          relaxation: ["Prenatal massage", "Warm baths", "Meditation"],
          preparation: ["Final hospital bag", "Install car seat", "Final preparations"]
        },
        intimacy: {
          safe: true,
          tips: ["Gentle approach", "Communicate openly", "Focus on connection"],
          positions: ["Side-lying", "Spooning", "Gentle positions"]
        },
        medical: {
          appointments: ["Weekly visits", "Group B strep test"],
          tests: ["Final ultrasounds", "Non-stress tests"],
          concerns: ["Labor signs", "Decreased movement", "Any concerns"]
        },
        tips: [
          "Baby could arrive anytime",
          "Final preparations",
          "Rest when possible",
          "Stay hydrated"
        ],
        funFacts: [
          "Baby is full-term",
          "Ready for birth",
          "All systems developed"
        ]
      }
    };

    return weekDataMap[week] || weekDataMap[1];
  }
}
