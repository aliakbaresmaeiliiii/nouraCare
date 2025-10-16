import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const forumCategories = [
  {
    name: 'Pregnancy Journey',
    description: 'Share your pregnancy experiences, milestones, and journey from conception to delivery',
    slug: 'pregnancy-journey',
    color: '#FF6B6B',
    icon: 'pregnancy',
    order: 1,
    topics: [
      {
        title: 'First Trimester Experiences',
        description: 'Share your first trimester journey, symptoms, and tips'
      },
      {
        title: 'Second Trimester Updates',
        description: 'How is your second trimester going? Share your progress!'
      },
      {
        title: 'Third Trimester Preparation',
        description: 'Getting ready for delivery - what are you doing to prepare?'
      }
    ]
  },
  {
    name: 'Parenting',
    description: 'Tips, advice, and support for parenting at all stages',
    slug: 'parenting',
    color: '#4ECDC4',
    icon: 'parenting',
    order: 2,
    topics: [
      {
        title: 'Newborn Care Tips',
        description: 'Share your best tips for caring for a newborn'
      },
      {
        title: 'Sleep Training Methods',
        description: 'What sleep training methods have worked for you?'
      },
      {
        title: 'Toddler Activities',
        description: 'Fun and educational activities for toddlers'
      }
    ]
  },
  {
    name: 'Nutrition & Diet',
    description: 'Healthy eating during pregnancy and for your family',
    slug: 'nutrition-diet',
    color: '#45B7D1',
    icon: 'nutrition',
    order: 3,
    topics: [
      {
        title: 'Pregnancy Nutrition Guide',
        description: 'What foods are essential during pregnancy?'
      },
      {
        title: 'Healthy Meal Prep Ideas',
        description: 'Share your favorite healthy meal prep recipes'
      },
      {
        title: 'Dealing with Food Aversions',
        description: 'How do you manage food aversions during pregnancy?'
      }
    ]
  },
  {
    name: 'Mental Health',
    description: 'Emotional wellbeing, stress management, and self-care',
    slug: 'mental-health',
    color: '#FF9FF3',
    icon: 'mental-health',
    order: 4,
    topics: [
      {
        title: 'Coping with Pregnancy Anxiety',
        description: 'Share your strategies for managing anxiety during pregnancy'
      },
      {
        title: 'Postpartum Mental Health',
        description: 'Support and advice for postpartum mental wellness'
      },
      {
        title: 'Self-Care for Busy Parents',
        description: 'How do you find time for self-care as a parent?'
      }
    ]
  },
  {
    name: 'Baby Products',
    description: 'Reviews and recommendations for baby products and gear',
    slug: 'baby-products',
    color: '#5F27CD',
    icon: 'baby-gear',
    order: 5,
    topics: [
      {
        title: 'Must-Have Baby Gear',
        description: 'What baby products are essential vs. nice-to-have?'
      },
      {
        title: 'Product Reviews & Recommendations',
        description: 'Share your experiences with different baby products'
      },
      {
        title: 'Budget-Friendly Baby Items',
        description: 'Affordable alternatives to expensive baby gear'
      }
    ]
  }
];

async function seedForumCategories() {
  console.log('🌱 Seeding forum categories...');

  try {
    // First, let's check if we have any users to use as createdBy
    const users = await prisma.user.findMany({
      take: 1
    });

    let createdById = 1; // Default fallback

    if (users.length > 0) {
      createdById = users[0].id;
      console.log(`👤 Using user ID ${createdById} as forum creator`);
    } else {
      console.log('⚠️ No users found, using default ID 1 (may cause foreign key issues)');
    }

    // Use upsert to avoid duplicates
    for (const categoryData of forumCategories) {
      await prisma.forumCategory.upsert({
        where: { slug: categoryData.slug },
        update: {
          name: categoryData.name,
          description: categoryData.description,
          color: categoryData.color,
          icon: categoryData.icon,
          order: categoryData.order,
        },
        create: {
          name: categoryData.name,
          description: categoryData.description,
          slug: categoryData.slug,
          color: categoryData.color,
          icon: categoryData.icon,
          order: categoryData.order,
          isActive: true,
       
        },
     
      });
    }

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
