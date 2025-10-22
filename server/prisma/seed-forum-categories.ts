import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding forum categories...')

  // Clear existing categories first
  await prisma.forumCategory.deleteMany()
  console.log('🗑️  Cleared existing forum categories')

  // Create comprehensive forum categories for women's health and parenting
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
    {
      name: 'Nutrition & Diet',
      description: 'Healthy eating during pregnancy, postpartum, and for the whole family',
      slug: 'nutrition-diet',
      color: '#FF6347',
      icon: '🥗',
      order: 6,
    },
    {
      name: 'Mental Health',
      description: 'Emotional wellbeing, stress management, and mental health support',
      slug: 'mental-health',
      color: '#8A2BE2',
      icon: '🧠',
      order: 7,
    },
    {
      name: 'Baby Products & Gear',
      description: 'Reviews, recommendations, and discussions about baby products',
      slug: 'baby-products',
      color: '#FFD700',
      icon: '🛒',
      order: 8,
    },
    {
      name: 'Postpartum Recovery',
      description: 'Physical and emotional recovery after childbirth',
      slug: 'postpartum-recovery',
      color: '#FF1493',
      icon: '🩹',
      order: 9,
    },
    {
      name: 'Breastfeeding & Pumping',
      description: 'Breastfeeding support, pumping tips, and lactation advice',
      slug: 'breastfeeding-pumping',
      color: '#87CEEB',
      icon: '🍼',
      order: 10,
    },
  ]

  for (const categoryData of categories) {
    const category = await prisma.forumCategory.create({
      data: categoryData,
    })
    console.log(`✅ Created category: ${category.name}`)
  }

  console.log('🎉 Forum categories seeded successfully!')
  console.log(`📊 Created ${categories.length} categories`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding forum categories:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
