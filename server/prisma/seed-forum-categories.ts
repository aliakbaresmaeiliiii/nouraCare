import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const forumCategories = [
  {
    name: 'Pregnancy Journey',
    description: 'Share your pregnancy experiences, milestones, and questions',
    slug: 'pregnancy-journey',
    color: '#FF6B9D',
    icon: '🤰',
    order: 1,
  },
  {
    name: 'Trying to Conceive',
    description: 'Support and advice for those trying to conceive',
    slug: 'trying-to-conceive',
    color: '#4ECDC4',
    icon: '💕',
    order: 2,
  },
  {
    name: 'New Parents',
    description: 'Life with your newborn and parenting tips',
    slug: 'new-parents',
    color: '#45B7D1',
    icon: '👶',
    order: 3,
  },
  {
    name: 'Health & Wellness',
    description: 'Physical and mental health during pregnancy and postpartum',
    slug: 'health-wellness',
    color: '#96CEB4',
    icon: '💪',
    order: 4,
  },
  {
    name: 'Relationships & Family',
    description: 'Navigating relationships and family dynamics',
    slug: 'relationships-family',
    color: '#FFEAA7',
    icon: '👨‍👩‍👧‍👦',
    order: 5,
  },
  {
    name: 'Product Reviews',
    description: 'Share reviews of pregnancy and baby products',
    slug: 'product-reviews',
    color: '#FD79A8',
    icon: '🛍️',
    order: 6,
  },
  {
    name: 'Birth Stories',
    description: 'Share your birth experiences and recovery journeys',
    slug: 'birth-stories',
    color: '#E17055',
    icon: '📖',
    order: 7,
  },
  {
    name: 'Ask the Community',
    description: 'Get answers to your questions from experienced parents',
    slug: 'ask-community',
    color: '#A29BFE',
    icon: '❓',
    order: 8,
  },
];

async function seedForumCategories() {
  console.log('🌱 Seeding forum categories...');

  try {
    // Use upsert to avoid duplicates
    for (const category of forumCategories) {
      await prisma.forumCategory.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          description: category.description,
          color: category.color,
          icon: category.icon,
          order: category.order,
        },
        create: category,
      });
    }

    console.log('✅ Forum categories seeded successfully!');
    console.log(`\n📊 Created/Updated ${forumCategories.length} forum categories:`);
    forumCategories.forEach(category => {
      console.log(`- ${category.icon} ${category.name} (/${category.slug})`);
    });

    console.log(`\n🧪 Test the forum categories API:`);
    console.log('- GET /api/v1/forum-categories (get all categories)');
    console.log('- GET /api/v1/forum-categories/pregnancy-journey (get by slug)');
    console.log('- POST /api/v1/forum-categories (create new category)');

  } catch (error) {
    console.error('❌ Error seeding forum categories:', error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedForumCategories()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export { seedForumCategories };
