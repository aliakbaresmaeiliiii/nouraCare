import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

interface ArticleCard {
  id: string;
  title: string;
  image: string;
  category: string;
  isPremium?: boolean;
  gradient?: string;
}

@Component({
  selector: 'app-insights',
  templateUrl: './insights.component.html',
  styleUrls: ['./insights.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class InsightsComponent implements OnInit {

  // Premium state
  isPremiumUnlocked = false;
  showUnlockAnimation = false;

  // Premium banner
  premiumBanner = {
    title: 'Unlock 1000+ expert articles and resources with Flo Premium',
    isVisible: true
  };

  // Article sections
  pregnancyPopular: ArticleCard[] = [
    {
      id: '1',
      title: 'Your changing body: Up to 42 weeks',
      image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=300&fit=crop',
      category: 'pregnancy',
      isPremium: false,
      gradient: 'linear-gradient(135deg, #e8d5ff 0%, #d4a4ff 100%)'
    },
    {
      id: '2',
      title: 'Pregnancy discharge decoded',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
      category: 'pregnancy',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #e0f4f3 0%, #b8e6e1 100%)'
    },
    {
      id: '3',
      title: 'How to prepare for labor',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      category: 'pregnancy',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #fff2e0 0%, #ffe0b8 100%)'
    }
  ];

  pregnancySexPleasure: ArticleCard[] = [
    {
      id: '4',
      title: '9 life-changing masturbation tips',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop',
      category: 'intimacy',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #f0e6ff 0%, #d4a4ff 100%)'
    },
    {
      id: '5',
      title: '8 bump-friendly sex positions',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      category: 'intimacy',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #ffe6f0 0%, #ffb8d4 100%)'
    },
    {
      id: '6',
      title: 'Pregnancy intimacy guide',
      image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop',
      category: 'intimacy',
      isPremium: false,
      gradient: 'linear-gradient(135deg, #e6f3ff 0%, #b8d4ff 100%)'
    }
  ];

  pregnancyBodySigns: ArticleCard[] = [
    {
      id: '7',
      title: 'Early pregnancy symptoms',
      image: 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=300&fit=crop',
      category: 'symptoms',
      isPremium: false,
      gradient: 'linear-gradient(135deg, #e6fff0 0%, #b8ffcc 100%)'
    },
    {
      id: '8',
      title: 'Understanding pregnancy cramps',
      image: 'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=400&h=300&fit=crop',
      category: 'symptoms',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #fff0e6 0%, #ffccb8 100%)'
    },
    {
      id: '9',
      title: 'Pregnancy skin changes',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      category: 'symptoms',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #f0ffe6 0%, #ccffb8 100%)'
    }
  ];

  // Nutrition articles
  nutritionNeedToKnow: ArticleCard[] = [
    {
      id: '10',
      title: 'How to eat safely while pregnant',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
      category: 'nutrition',
      isPremium: false,
      gradient: 'linear-gradient(135deg, #d4f1d4 0%, #a8e6a8 100%)'
    },
    {
      id: '11',
      title: 'How much coffee is too much?',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop',
      category: 'nutrition',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #f4e4d0 0%, #e6c8a0 100%)'
    },
    {
      id: '12',
      title: 'Prenatal vitamins guide',
      image: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
      category: 'nutrition',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #fff0e6 0%, #ffccb8 100%)'
    }
  ];

  // Baby development articles
  allAboutYourBaby: ArticleCard[] = [
    {
      id: '13',
      title: 'Baby\'s support system',
      image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&h=300&fit=crop',
      category: 'baby',
      isPremium: false,
      gradient: 'linear-gradient(135deg, #fde8e8 0%, #f7c6c6 100%)'
    },
    {
      id: '14',
      title: 'How often should your baby move?',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
      category: 'baby',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #e8d5ff 0%, #d4a4ff 100%)'
    },
    {
      id: '15',
      title: 'Getting ready for your little one',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop',
      category: 'baby',
      isPremium: true,
      gradient: 'linear-gradient(135deg, #e0f4f3 0%, #b8e6e1 100%)'
    }
  ];

  constructor(private router: Router) { }

  ngOnInit() {}

  // Close premium banner
  closePremiumBanner() {
    this.premiumBanner.isVisible = false;
  }

  // Toggle premium
  togglePremium() {
    if (!this.isPremiumUnlocked) {
      this.showUnlockAnimation = true;
      
      // Simulate unlock animation
      setTimeout(() => {
        this.isPremiumUnlocked = true;
        this.premiumBanner.isVisible = false;
        this.showUnlockAnimation = false;
      }, 2000);
    } else {
      // If already unlocked, lock it back for demo purposes
      this.isPremiumUnlocked = false;
      this.premiumBanner.isVisible = true;
    }
  }

  // Open article
  openArticle(article: ArticleCard) {
    console.log('Opening article:', article.title);
    // Navigate to article detail or show modal
  }

  // Handle image error
  handleImageError(event: Event, category: string) {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.src = this.getFallbackImage(category);
    }
  }

  // Get fallback image
  getFallbackImage(category: string): string {
    const fallbacks = {
      pregnancy: 'assets/images/welcome1.jpg',
      intimacy: 'assets/images/welcome2.jpg',
      symptoms: 'assets/images/welcome3.jpg',
      nutrition: 'assets/images/welcome1.jpg',
      baby: 'assets/images/welcome2.jpg'
    };
    return fallbacks[category as keyof typeof fallbacks] || 'assets/images/heart.png';
  }
}
