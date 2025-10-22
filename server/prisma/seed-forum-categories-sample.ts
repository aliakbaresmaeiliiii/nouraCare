import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding SAMPLE forum categories...')

  // Create sample forum categories - this doesn't delete existing data
  const categories = [
    {
      name: 'Pregnancy & Fertility',
      description: 'Discuss pregnancy, fertility, trying to conceive, and reproductive health',
      slug: 'pregnancy-fertility',
      color: '#FF69B4',
      icon: '🤰',
      order: 1,
    },
    {
      name: 'Parenting & Childcare',
      description: 'Share parenting tips, childcare advice, and family life experiences',
      slug: 'parenting-childcare',
      color: '#4169E1',
      icon: '👶',
      order: 2,
    },
    {
      name: 'Health & Wellness',
      description: 'Women\'s health, wellness, self-care, and medical discussions',
      slug: 'health-wellness',
      color: '#32CD32',
      icon: '💚',
      order: 3,
    },
    {
      name: 'Relationships & Support',
      description: 'Relationship advice, emotional support, and community connections',
      slug: 'relationships-support',
      color: '#FFA500',
      icon: '💕',
      order: 4,
    },
    {
      name: 'Career & Lifestyle',
      description: 'Career advice, work-life balance, and lifestyle topics for women',
      slug: 'career-lifestyle',
      color: '#9370DB',
      icon: '💼',
      order: 5,
    },
  ]

  for (const categoryData of categories) {
    try {
      const category = await prisma.forumCategory.create({
        data: categoryData,
      })
      console.log(`✅ Created category: ${category.name}`)
    } catch (error) {
      console.log(`ℹ️  Category already exists or error: ${categoryData.name}`)
    }
  }

  console.log('🎉 SAMPLE Forum categories seeded successfully!')
  console.log(`📊 Attempted to create ${categories.length} categories`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding forum categories:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
