import type { ArticleContent } from '../../article-detail/article.types';

/** Sample article bodies (EN) for article detail. */
export const ARTICLE_DATABASE_EN: Record<string, ArticleContent> = {
  "1": {
    "id": "1",
    "title": "Your changing body: Up to 42 weeks",
    "category": "Pregnancy",
    "author": "Dr. Maria Santos",
    "publishDate": "2024-01-20",
    "readTime": "7 min read",
    "image": "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&h=400&fit=crop",
    "summary": "A comprehensive guide to the physical and emotional changes you can expect throughout your pregnancy journey.",
    "content": [
      {
        "type": "paragraph",
        "content": "Pregnancy brings incredible changes to your body over 40+ weeks. Understanding what to expect can help you feel more confident and prepared for this amazing journey."
      },
      {
        "type": "heading",
        "content": "First Trimester (Weeks 1-12)"
      },
      {
        "type": "paragraph",
        "content": "Early pregnancy symptoms like morning sickness, breast tenderness, and fatigue are common as your body adjusts to hormonal changes."
      },
      {
        "type": "heading",
        "content": "Second Trimester (Weeks 13-27)"
      },
      {
        "type": "paragraph",
        "content": "Often called the \"golden period,\" many women feel more energetic and experience the joy of feeling baby's first movements."
      },
      {
        "type": "heading",
        "content": "Third Trimester (Weeks 28-42)"
      },
      {
        "type": "paragraph",
        "content": "Your baby grows rapidly, and you may experience new symptoms like heartburn, back pain, and Braxton Hicks contractions as your body prepares for birth."
      }
    ],
    "tags": [
      "Pregnancy",
      "Body Changes",
      "Trimesters",
      "Development"
    ],
    "relatedArticles": [
      "2",
      "7"
    ]
  },
  "10": {
    "id": "10",
    "title": "How to eat safely while pregnant",
    "category": "Nutrition",
    "author": "Dr. Sarah Johnson",
    "publishDate": "2024-01-15",
    "readTime": "5 min read",
    "image": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=400&fit=crop",
    "summary": "Essential guidelines for safe eating during pregnancy to ensure both mother and baby stay healthy.",
    "content": [
      {
        "type": "paragraph",
        "content": "Eating safely during pregnancy is crucial for both your health and your baby's development. Here's everything you need to know about maintaining a safe and nutritious diet during this important time."
      },
      {
        "type": "heading",
        "content": "Foods to Embrace"
      },
      {
        "type": "list",
        "content": "Include these pregnancy-safe foods in your daily diet:",
        "items": [
          "Fresh fruits and vegetables (thoroughly washed)",
          "Lean proteins like chicken, fish (low mercury), and legumes",
          "Whole grains and fortified cereals",
          "Dairy products (pasteurized only)",
          "Plenty of water and pregnancy-safe beverages"
        ]
      },
      {
        "type": "heading",
        "content": "Foods to Avoid"
      },
      {
        "type": "list",
        "content": "Stay away from these potentially harmful foods:",
        "items": [
          "Raw or undercooked meats, eggs, and seafood",
          "High-mercury fish (shark, swordfish, king mackerel)",
          "Unpasteurized dairy products and soft cheeses",
          "Raw sprouts and unwashed produce",
          "Excessive caffeine and alcohol"
        ]
      },
      {
        "type": "quote",
        "content": "Remember, what you eat during pregnancy directly affects your baby's growth and development. Make every bite count!"
      },
      {
        "type": "heading",
        "content": "Safe Food Preparation Tips"
      },
      {
        "type": "paragraph",
        "content": "Proper food handling is essential during pregnancy. Always wash your hands before preparing food, cook meats to appropriate temperatures, and store leftovers promptly in the refrigerator."
      },
      {
        "type": "paragraph",
        "content": "When dining out, choose reputable establishments and opt for well-cooked meals. Don't hesitate to ask about ingredients if you're unsure about a dish's safety."
      }
    ],
    "tags": [
      "Pregnancy",
      "Nutrition",
      "Food Safety",
      "Health"
    ],
    "relatedArticles": [
      "11",
      "12"
    ]
  },
  "11": {
    "id": "11",
    "title": "How much coffee is too much?",
    "category": "Nutrition",
    "author": "Dr. Emily Rodriguez",
    "publishDate": "2024-01-10",
    "readTime": "4 min read",
    "image": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=400&fit=crop",
    "summary": "Understanding caffeine limits during pregnancy and healthy alternatives to keep you energized.",
    "content": [
      {
        "type": "paragraph",
        "content": "Many expectant mothers wonder about their coffee consumption during pregnancy. The good news is you don't have to give up caffeine entirely, but moderation is key."
      },
      {
        "type": "heading",
        "content": "Safe Caffeine Limits"
      },
      {
        "type": "paragraph",
        "content": "Most healthcare providers recommend limiting caffeine intake to 200mg per day during pregnancy. This equals about one 12-ounce cup of coffee or two cups of tea."
      },
      {
        "type": "list",
        "content": "Common caffeine sources and their amounts:",
        "items": [
          "Coffee (8 oz): 80-100mg",
          "Tea (8 oz): 40-50mg",
          "Dark chocolate (1 oz): 12mg",
          "Cola (12 oz): 34mg",
          "Energy drinks: 50-160mg"
        ]
      },
      {
        "type": "heading",
        "content": "Healthy Alternatives"
      },
      {
        "type": "paragraph",
        "content": "Try herbal teas, decaf coffee, or naturally energizing foods like fruits and nuts to maintain your energy levels safely."
      }
    ],
    "tags": [
      "Pregnancy",
      "Caffeine",
      "Coffee",
      "Nutrition"
    ],
    "relatedArticles": [
      "10",
      "12"
    ]
  }
};
