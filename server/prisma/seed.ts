import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create forum categories
  console.log('📝 Creating forum categories...');
  
  const forumCategories = [
    // Pregnancy-related categories
    {
      id: 'pregnancy-journey',
      name: 'Pregnancy Journey',
      description: 'Share your pregnancy experiences, milestones, and journey from conception to delivery',
      slug: 'pregnancy-journey',
      color: '#FF6B6B',
      icon: 'pregnancy',
      order: 1,
      isActive: true,
    },
    {
      id: 'first-trimester',
      name: 'First Trimester',
      description: 'Early pregnancy discussions, symptoms, and support for weeks 1-12',
      slug: 'first-trimester',
      color: '#FF9F43',
      icon: 'baby-bump',
      order: 2,
      isActive: true,
    },
    {
      id: 'second-trimester',
      name: 'Second Trimester',
      description: 'Mid-pregnancy topics, baby development, and preparation',
      slug: 'second-trimester',
      color: '#10AC84',
      icon: 'baby-heartbeat',
      order: 3,
      isActive: true,
    },
    {
      id: 'third-trimester',
      name: 'Third Trimester',
      description: 'Late pregnancy, labor preparation, and final weeks',
      slug: 'third-trimester',
      color: '#0ABDE3',
      icon: 'baby-carriage',
      order: 4,
      isActive: true,
    },

    // Parenting categories
    {
      id: 'newborn-care',
      name: 'Newborn Care',
      description: 'Tips and support for caring for your newborn (0-3 months)',
      slug: 'newborn-care',
      color: '#54A0FF',
      icon: 'baby-bottle',
      order: 5,
      isActive: true,
    },
    {
      id: 'infant-development',
      name: 'Infant Development',
      description: 'Milestones and development for babies 3-12 months',
      slug: 'infant-development',
      color: '#5F27CD',
      icon: 'baby-rattle',
      order: 6,
      isActive: true,
    },
    {
      id: 'toddler-parenting',
      name: 'Toddler Parenting',
      description: 'Parenting challenges and joys for 1-3 year olds',
      slug: 'toddler-parenting',
      color: '#FF9FF3',
      icon: 'baby-walker',
      order: 7,
      isActive: true,
    },

    // Health and Wellness
    {
      id: 'nutrition-diet',
      name: 'Nutrition & Diet',
      description: 'Healthy eating during pregnancy and for your family',
      slug: 'nutrition-diet',
      color: '#00D2D3',
      icon: 'nutrition',
      order: 8,
      isActive: true,
    },
    {
      id: 'mental-health',
      name: 'Mental Health',
      description: 'Emotional wellbeing, stress management, and self-care',
      slug: 'mental-health',
      color: '#FF6B9D',
      icon: 'mental-health',
      order: 9,
      isActive: true,
    },
    {
      id: 'fitness-exercise',
      name: 'Fitness & Exercise',
      description: 'Safe exercise routines and physical activity during pregnancy',
      slug: 'fitness-exercise',
      color: '#1DD1A1',
      icon: 'fitness',
      order: 10,
      isActive: true,
    },

    // Practical categories
    {
      id: 'baby-gear-products',
      name: 'Baby Gear & Products',
      description: 'Reviews and recommendations for baby products and gear',
      slug: 'baby-gear-products',
      color: '#F368E0',
      icon: 'baby-gear',
      order: 11,
      isActive: true,
    },
    {
      id: 'breastfeeding-formula',
      name: 'Breastfeeding & Formula',
      description: 'Feeding support, tips, and troubleshooting',
      slug: 'breastfeeding-formula',
      color: '#FF9F43',
      icon: 'breastfeeding',
      order: 12,
      isActive: true,
    },
    {
      id: 'sleep-solutions',
      name: 'Sleep Solutions',
      description: 'Sleep tips and challenges for parents and babies',
      slug: 'sleep-solutions',
      color: '#54A0FF',
      icon: 'sleep',
      order: 13,
      isActive: true,
    },

    // Community and Support
    {
      id: 'relationships-family',
      name: 'Relationships & Family',
      description: 'Navigating relationships during pregnancy and parenthood',
      slug: 'relationships-family',
      color: '#5F27CD',
      icon: 'family',
      order: 14,
      isActive: true,
    },
    {
      id: 'work-career-balance',
      name: 'Work & Career Balance',
      description: 'Balancing work, career, and family life',
      slug: 'work-career-balance',
      color: '#00D2D3',
      icon: 'work',
      order: 15,
      isActive: true,
    },
    {
      id: 'community-support',
      name: 'Community Support',
      description: 'General support, advice, and community discussions',
      slug: 'community-support',
      color: '#FF6B9D',
      icon: 'community',
      order: 16,
      isActive: true,
    },
  ];

  for (const categoryData of forumCategories) {
    await prisma.forum_categories.upsert({
      where: { id: categoryData.id },
      update: {
        ...categoryData,
        updatedAt: new Date(),
      },
      create: {
        ...categoryData,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  console.log(`✅ Created ${forumCategories.length} forum categories`);
  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
