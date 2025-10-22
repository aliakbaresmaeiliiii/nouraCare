import { PrismaClient } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding SAMPLE forum threads...')

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

  // Create sample forum threads - this doesn't delete existing data
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
  ]

  let createdCount = 0
  let skippedCount = 0

  for (const threadData of threads) {
    try {
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
      createdCount++
    } catch (error) {
      console.log(`ℹ️  Thread already exists or error: ${threadData.title}`)
      skippedCount++
    }
  }

  console.log('🎉 SAMPLE Forum threads seeded successfully!')
  console.log(`📊 Created ${createdCount} threads, skipped ${skippedCount} threads across ${categories.length} categories`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding forum threads:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
