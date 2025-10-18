import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding forum categories...')

  // Clear existing categories first
  await prisma.forumCategory.deleteMany()
  console.log('🗑️  Cleared existing forum categories')

  // Create 5 sample forum categories
  const categories = [
    {
      name: 'Pregnancy & Fertility',
      description: 'Discuss pregnancy, fertility, and trying to conceive',
      slug: 'pregnancy-fertility',
      color: '#FF69B4',
      icon: '🤰',
      order: 1,
    },
    {
      name: 'Parenting & Childcare',
      description: 'Share parenting tips, childcare advice, and family life',
      slug: 'parenting-childcare',
      color: '#4169E1',
      icon: '👶',
      order: 2,
    },
    {
      name: 'Health & Wellness',
      description: 'Women\'s health, wellness, and self-care discussions',
      slug: 'health-wellness',
      color: '#32CD32',
      icon: '💚',
      order: 3,
    },
    {
      name: 'Relationships & Support',
      description: 'Relationship advice, emotional support, and community',
      slug: 'relationships-support',
      color: '#FFA500',
      icon: '💕',
      order: 4,
    },
    {
      name: 'Career & Lifestyle',
      description: 'Career advice, work-life balance, and lifestyle topics',
      slug: 'career-lifestyle',
      color: '#9370DB',
      icon: '💼',
      order: 5,
    },
  ]

  for (const categoryData of categories) {
    const category = await prisma.forumCategory.create({
      data: categoryData,
    })
    console.log(`✅ Created category: ${category.name}`)
  }

  console.log('🎉 Forum categories seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding forum categories:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
