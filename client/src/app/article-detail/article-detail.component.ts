import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { FavoritesService } from '../shared/services/favorites.service';

interface ArticleContent {
  id: string;
  title: string;
  category: string;
  author: string;
  publishDate: string;
  readTime: string;
  image: string;
  summary: string;
  content: ArticleSection[];
  tags: string[];
  relatedArticles: string[];
}

interface ArticleSection {
  type: 'paragraph' | 'heading' | 'list' | 'quote' | 'image';
  content: string;
  items?: string[];
}

@Component({
  selector: 'app-article-detail',
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class ArticleDetailComponent implements OnInit {
  article: ArticleContent | null = null;
  isLoading = true;
  isFavorite = false;
  isMobile = false;

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private favoritesService = inject(FavoritesService);

  // Sample article database
  private articleDatabase: { [key: string]: ArticleContent } = {
    '10': {
      id: '10',
      title: 'How to eat safely while pregnant',
      category: 'Nutrition',
      author: 'Dr. Sarah Johnson',
      publishDate: '2024-01-15',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=400&fit=crop',
      summary: 'Essential guidelines for safe eating during pregnancy to ensure both mother and baby stay healthy.',
      content: [
        {
          type: 'paragraph',
          content: 'Eating safely during pregnancy is crucial for both your health and your baby\'s development. Here\'s everything you need to know about maintaining a safe and nutritious diet during this important time.'
        },
        {
          type: 'heading',
          content: 'Foods to Embrace'
        },
        {
          type: 'list',
          content: 'Include these pregnancy-safe foods in your daily diet:',
          items: [
            'Fresh fruits and vegetables (thoroughly washed)',
            'Lean proteins like chicken, fish (low mercury), and legumes',
            'Whole grains and fortified cereals',
            'Dairy products (pasteurized only)',
            'Plenty of water and pregnancy-safe beverages'
          ]
        },
        {
          type: 'heading',
          content: 'Foods to Avoid'
        },
        {
          type: 'list',
          content: 'Stay away from these potentially harmful foods:',
          items: [
            'Raw or undercooked meats, eggs, and seafood',
            'High-mercury fish (shark, swordfish, king mackerel)',
            'Unpasteurized dairy products and soft cheeses',
            'Raw sprouts and unwashed produce',
            'Excessive caffeine and alcohol'
          ]
        },
        {
          type: 'quote',
          content: 'Remember, what you eat during pregnancy directly affects your baby\'s growth and development. Make every bite count!'
        },
        {
          type: 'heading',
          content: 'Safe Food Preparation Tips'
        },
        {
          type: 'paragraph',
          content: 'Proper food handling is essential during pregnancy. Always wash your hands before preparing food, cook meats to appropriate temperatures, and store leftovers promptly in the refrigerator.'
        },
        {
          type: 'paragraph',
          content: 'When dining out, choose reputable establishments and opt for well-cooked meals. Don\'t hesitate to ask about ingredients if you\'re unsure about a dish\'s safety.'
        }
      ],
      tags: ['Pregnancy', 'Nutrition', 'Food Safety', 'Health'],
      relatedArticles: ['11', '12']
    },
    '11': {
      id: '11',
      title: 'How much coffee is too much?',
      category: 'Nutrition',
      author: 'Dr. Emily Rodriguez',
      publishDate: '2024-01-10',
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=400&fit=crop',
      summary: 'Understanding caffeine limits during pregnancy and healthy alternatives to keep you energized.',
      content: [
        {
          type: 'paragraph',
          content: 'Many expectant mothers wonder about their coffee consumption during pregnancy. The good news is you don\'t have to give up caffeine entirely, but moderation is key.'
        },
        {
          type: 'heading',
          content: 'Safe Caffeine Limits'
        },
        {
          type: 'paragraph',
          content: 'Most healthcare providers recommend limiting caffeine intake to 200mg per day during pregnancy. This equals about one 12-ounce cup of coffee or two cups of tea.'
        },
        {
          type: 'list',
          content: 'Common caffeine sources and their amounts:',
          items: [
            'Coffee (8 oz): 80-100mg',
            'Tea (8 oz): 40-50mg',
            'Dark chocolate (1 oz): 12mg',
            'Cola (12 oz): 34mg',
            'Energy drinks: 50-160mg'
          ]
        },
        {
          type: 'heading',
          content: 'Healthy Alternatives'
        },
        {
          type: 'paragraph',
          content: 'Try herbal teas, decaf coffee, or naturally energizing foods like fruits and nuts to maintain your energy levels safely.'
        }
      ],
      tags: ['Pregnancy', 'Caffeine', 'Coffee', 'Nutrition'],
      relatedArticles: ['10', '12']
    },
    '1': {
      id: '1',
      title: 'Your changing body: Up to 42 weeks',
      category: 'Pregnancy',
      author: 'Dr. Maria Santos',
      publishDate: '2024-01-20',
      readTime: '7 min read',
      image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=400&fit=crop',
      summary: 'A comprehensive guide to the physical and emotional changes you can expect throughout your pregnancy journey.',
      content: [
        {
          type: 'paragraph',
          content: 'Pregnancy brings incredible changes to your body over 40+ weeks. Understanding what to expect can help you feel more confident and prepared for this amazing journey.'
        },
        {
          type: 'heading',
          content: 'First Trimester (Weeks 1-12)'
        },
        {
          type: 'paragraph',
          content: 'Early pregnancy symptoms like morning sickness, breast tenderness, and fatigue are common as your body adjusts to hormonal changes.'
        },
        {
          type: 'heading',
          content: 'Second Trimester (Weeks 13-27)'
        },
        {
          type: 'paragraph',
          content: 'Often called the "golden period," many women feel more energetic and experience the joy of feeling baby\'s first movements.'
        },
        {
          type: 'heading',
          content: 'Third Trimester (Weeks 28-42)'
        },
        {
          type: 'paragraph',
          content: 'Your baby grows rapidly, and you may experience new symptoms like heartburn, back pain, and Braxton Hicks contractions as your body prepares for birth.'
        }
      ],
      tags: ['Pregnancy', 'Body Changes', 'Trimesters', 'Development'],
      relatedArticles: ['2', '7']
    }
  };

  ngOnInit() {
    // Detect if user is on mobile device
    this.detectMobileDevice();
    
    this.activatedRoute.params.subscribe(params => {
      const articleId = params['id'];
      this.loadArticle(articleId);
    });
  }

  private detectMobileDevice() {
    // Check for mobile device using multiple methods
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Check for mobile user agents
    const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    
    // Check for touch capability
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    // Check screen width (mobile-like width)
    const isMobileWidth = window.innerWidth <= 768;
    
    // Check if Web Share API is supported (typically mobile)
    const hasWebShare = 'share' in navigator;
    
    // Device is considered mobile if it meets multiple criteria
    this.isMobile = isMobileUserAgent && (isTouchDevice || isMobileWidth || hasWebShare);
  }

  loadArticle(articleId: string) {
    this.isLoading = true;
    
    // Simulate API call with timeout
    setTimeout(() => {
      this.article = this.articleDatabase[articleId] || null;
      this.isLoading = false;
      
      if (this.article) {
        this.checkFavoriteStatus();
      }
    }, 500);
  }

  checkFavoriteStatus() {
    if (this.article) {
      this.favoritesService.isFavorite(this.article.id).subscribe(isFav => {
        this.isFavorite = isFav;
      });
    }
  }

  toggleFavorite() {
    if (!this.article) return;

    const favoriteItem = {
      id: this.article.id,
      type: 'article' as const,
      title: this.article.title,
      description: this.article.summary,
      image: this.article.image,
      category: this.article.category,
      data: this.article
    };

    this.favoritesService.toggleFavorite(favoriteItem);
    this.isFavorite = !this.isFavorite;
  }

  shareArticle() {
    if (!this.article || !this.isMobile) return;

    if (navigator.share) {
      navigator.share({
        title: this.article.title,
        text: this.article.summary,
        url: window.location.href,
      }).catch(err => {
        console.log('Error sharing:', err);
        // Fallback to clipboard on mobile if share fails
        this.copyToClipboard();
      });
    } else {
      // Fallback for mobile devices without Web Share API
      this.copyToClipboard();
    }
  }

  private copyToClipboard() {
    if (!this.article) return;
    
    const shareText = `${this.article.title}\n\n${this.article.summary}\n\n${window.location.href}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareText).then(() => {
        console.log('Article link copied to clipboard');
      }).catch(err => {
        console.log('Failed to copy to clipboard:', err);
      });
    }
  }

  goBack() {
    this.router.navigate(['/tabs/insights']);
  }

  openRelatedArticle(articleId: string) {
    this.router.navigate(['/article', articleId]);
  }
}