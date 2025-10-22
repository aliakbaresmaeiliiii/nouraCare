import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding forum threads...')

  // Get all categories to assign threads to
  const categories = await prisma.forumCategory.findMany()
  if (categories.length === 0) {
    console.error('❌ No forum categories found. Please run forum categories seed first.')
    process.exit(1)
  }

  // Check if we have any users, create a test user if none exists
  let testUserId = 1
  const existingUser = await prisma.user.findFirst()
  if (!existingUser) {
    console.log('👤 No users found, creating a test user...')
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        phone: '+1234567890',
        name: 'Test User',
        isVerified: true,
      },
    })
    testUserId = testUser.id
    console.log(`✅ Created test user with ID: ${testUserId}`)
  } else {
    testUserId = existingUser.id
    console.log(`👤 Using existing user with ID: ${testUserId}`)
  }

  // Clear existing threads first
  await prisma.forum_thread.deleteMany()
  console.log('🗑️  Cleared existing forum threads')

  // Create comprehensive forum threads (3-4 per category)
  const threads = [
    // Pregnancy & Fertility threads
    {
      title: 'First Trimester Symptoms & Tips',
      description: 'Share your experiences and tips for managing first trimester symptoms like morning sickness, fatigue, and food aversions.',
      categoryId: categories[0].id,
      createdById: testUserId,
    },
    {
      title: 'Fertility Tracking Methods',
      description: 'Discuss different fertility tracking methods, apps, and tools that have worked for you.',
      categoryId: categories[0].id,
      createdById: testUserId,
    },
    {
      title: 'Pregnancy Nutrition Guide',
      description: 'What foods are essential during pregnancy? Share your favorite healthy pregnancy recipes.',
      categoryId: categories[0].id,
      createdById: testUserId,
    },
    {
      title: 'Dealing with Pregnancy Anxiety',
      description: 'How do you manage anxiety and stress during pregnancy? Looking for coping strategies.',
      categoryId: categories[0].id,
      createdById: testUserId,
    },

    // Parenting & Childcare threads
    {
      title: 'Sleep Training Advice Needed',
      description: 'Looking for advice on sleep training methods for my 6-month-old. What worked for your family?',
      categoryId: categories[1].id,
      createdById: testUserId,
    },
    {
      title: 'Balancing Work and Parenting',
      description: 'How do you manage work-life balance as a parent? Share your strategies and tips.',
      categoryId: categories[1].id,
      createdById: testUserId,
    },
    {
      title: 'Toddler Activities & Play Ideas',
      description: 'Share fun and educational activities for toddlers. Looking for creative play ideas!',
      categoryId: categories[1].id,
      createdById: testUserId,
    },
    {
      title: 'Choosing the Right Preschool',
      description: 'What factors should I consider when choosing a preschool? Any recommendations?',
      categoryId: categories[1].id,
      createdById: testUserId,
    },

    // Health & Wellness threads
    {
      title: 'PCOS Management Tips',
      description: 'Looking for advice on managing PCOS symptoms naturally. What lifestyle changes have helped you?',
      categoryId: categories[2].id,
      createdById: testUserId,
    },
    {
      title: 'Mental Health Support Group',
      description: 'A safe space to discuss mental health challenges and share coping strategies.',
      categoryId: categories[2].id,
      createdById: testUserId,
    },
    {
      title: 'Exercise During Pregnancy',
      description: 'What types of exercise are safe during pregnancy? Share your workout routines.',
      categoryId: categories[2].id,
      createdById: testUserId,
    },
    {
      title: 'Postpartum Checkup Questions',
      description: 'What questions should I ask at my postpartum checkup? Preparing for my appointment.',
      categoryId: categories[2].id,
      createdById: testUserId,
    },

    // Relationships & Support threads
    {
      title: 'Communication in Relationships',
      description: 'How do you maintain healthy communication with your partner during stressful times?',
      categoryId: categories[3].id,
      createdById: testUserId,
    },
    {
      title: 'Building a Support Network',
      description: 'Tips for building and maintaining a strong support network as a woman and/or parent.',
      categoryId: categories[3].id,
      createdById: testUserId,
    },
    {
      title: 'Dealing with Unsolicited Advice',
      description: 'How do you handle unsolicited parenting advice from family and friends?',
      categoryId: categories[3].id,
      createdById: testUserId,
    },
    {
      title: 'Making Mom Friends',
      description: 'Tips for making new mom friends and building community connections.',
      categoryId: categories[3].id,
      createdById: testUserId,
    },

    // Career & Lifestyle threads
    {
      title: 'Returning to Work After Maternity Leave',
      description: 'Share your experiences and advice for returning to work after maternity leave.',
      categoryId: categories[4].id,
      createdById: testUserId,
    },
    {
      title: 'Remote Work with Kids',
      description: 'How do you manage remote work while caring for young children? Looking for practical tips.',
      categoryId: categories[4].id,
      createdById: testUserId,
    },
    {
      title: 'Freelancing as a Parent',
      description: 'Experiences with freelancing or starting a business while parenting? Share your journey.',
      categoryId: categories[4].id,
      createdById: testUserId,
    },
    {
      title: 'Career Break Planning',
      description: 'Considering taking a career break for parenting? Let\'s discuss the pros and cons.',
      categoryId: categories[4].id,
      createdById: testUserId,
    },

    // Nutrition & Diet threads
    {
      title: 'Healthy Meal Prep for Busy Parents',
      description: 'Share your favorite healthy meal prep recipes that are family-friendly.',
      categoryId: categories[5].id,
      createdById: testUserId,
    },
    {
      title: 'Picky Eater Solutions',
      description: 'How do you handle picky eaters? Looking for creative ways to encourage healthy eating.',
      categoryId: categories[5].id,
      createdById: testUserId,
    },
    {
      title: 'Postpartum Nutrition',
      description: 'What foods help with postpartum recovery and energy levels?',
      categoryId: categories[5].id,
      createdById: testUserId,
    },
    {
      title: 'Healthy Snack Ideas for Kids',
      description: 'Share your go-to healthy snack ideas for toddlers and young children.',
      categoryId: categories[5].id,
      createdById: testUserId,
    },

    // Mental Health threads
    {
      title: 'Coping with Pregnancy Anxiety',
      description: 'Share your strategies for managing anxiety during pregnancy.',
      categoryId: categories[6].id,
      createdById: testUserId,
    },
    {
      title: 'Postpartum Mental Health',
      description: 'Support and advice for postpartum mental wellness and recovery.',
      categoryId: categories[6].id,
      createdById: testUserId,
    },
    {
      title: 'Self-Care for Busy Parents',
      description: 'How do you find time for self-care as a parent? Share your routines.',
      categoryId: categories[6].id,
      createdById: testUserId,
    },
    {
      title: 'Managing Mom Guilt',
      description: 'How do you deal with mom guilt and perfectionism? Looking for support.',
      categoryId: categories[6].id,
      createdById: testUserId,
    },

    // Baby Products & Gear threads
    {
      title: 'Must-Have Baby Gear',
      description: 'What baby products are essential vs. nice-to-have? Share your recommendations.',
      categoryId: categories[7].id,
      createdById: testUserId,
    },
    {
      title: 'Product Reviews & Recommendations',
      description: 'Share your experiences with different baby products - strollers, car seats, etc.',
      categoryId: categories[7].id,
      createdById: testUserId,
    },
    {
      title: 'Budget-Friendly Baby Items',
      description: 'Affordable alternatives to expensive baby gear. What\'s worth the splurge?',
      categoryId: categories[7].id,
      createdById: testUserId,
    },
    {
      title: 'Eco-Friendly Baby Products',
      description: 'Recommendations for sustainable and eco-friendly baby products.',
      categoryId: categories[7].id,
      createdById: testUserId,
    },

    // Postpartum Recovery threads
    {
      title: 'Physical Recovery After Birth',
      description: 'Share your experiences with postpartum physical recovery and healing.',
      categoryId: categories[8].id,
      createdById: testUserId,
    },
    {
      title: 'Postpartum Exercise Journey',
      description: 'When did you start exercising after birth? What worked for you?',
      categoryId: categories[8].id,
      createdById: testUserId,
    },
    {
      title: 'Managing Postpartum Pain',
      description: 'Tips for managing postpartum pain and discomfort.',
      categoryId: categories[8].id,
      createdById: testUserId,
    },
    {
      title: 'Body Image After Baby',
      description: 'How do you navigate body image changes after having a baby?',
      categoryId: categories[8].id,
      createdById: testUserId,
    },

    // Breastfeeding & Pumping threads
    {
      title: 'Breastfeeding Challenges & Solutions',
      description: 'Share your breastfeeding journey and how you overcame challenges.',
      categoryId: categories[9].id,
      createdById: testUserId,
    },
    {
      title: 'Pumping Tips and Schedules',
      description: 'What pumping schedule works best? Looking for tips for working moms.',
      categoryId: categories[9].id,
      createdById: testUserId,
    },
    {
      title: 'Breastfeeding in Public',
      description: 'Experiences and tips for breastfeeding in public comfortably.',
      categoryId: categories[9].id,
      createdById: testUserId,
    },
    {
      title: 'Weaning Journey',
      description: 'Share your weaning experiences and tips for a smooth transition.',
      categoryId: categories[9].id,
      createdById: testUserId,
    },
  ]

  for (const threadData of threads) {
    const thread = await prisma.forum_thread.create({
      data: {
        id: uuidv4(),
        title: threadData.title,
        description: threadData.description,
        categoryId: threadData.categoryId,
        createdById: threadData.createdById,
        isPublic: true,
        isActive: true,
        updatedAt: new Date(),
      } as any, // Type assertion to bypass Prisma type issues
    })
    console.log(`✅ Created thread: ${thread.title}`)
  }

  console.log('🎉 Forum threads seeded successfully!')
  console.log(`📊 Created ${threads.length} threads across ${categories.length} categories`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding forum threads:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
