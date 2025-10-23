import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding forum data...')

  // Create forum categories
  const categories = [
    {
      id: 'pregnancy-discussions',
      name: 'Pregnancy Discussions',
      description: 'Share experiences and ask questions about pregnancy',
      slug: 'pregnancy-discussions',
      color: '#FF6B6B',
      icon: '🤰',
      order: 1,
    },
    {
      id: 'fertility-support',
      name: 'Fertility Support',
      description: 'Support and advice for fertility journeys',
      slug: 'fertility-support',
      color: '#4ECDC4',
      icon: '🌱',
      order: 2,
    },
    {
      id: 'parenting-advice',
      name: 'Parenting Advice',
      description: 'Tips and advice for new parents',
      slug: 'parenting-advice',
      color: '#45B7D1',
      icon: '👶',
      order: 3,
    },
    {
      id: 'health-wellness',
      name: 'Health & Wellness',
      description: 'Discuss health, nutrition, and wellness during pregnancy',
      slug: 'health-wellness',
      color: '#96CEB4',
      icon: '💪',
      order: 4,
    },
  ]

  // Create categories
  for (const categoryData of categories) {
    await prisma.forumCategory.upsert({
      where: { id: categoryData.id },
      update: categoryData,
      create: categoryData,
    })
    console.log(`✅ Created category: ${categoryData.name}`)
  }

  // Get a user to use as author
  const user = await prisma.user.findFirst()
  if (!user) {
    console.log('❌ No users found. Please create a user first.')
    return
  }

  // Create forums
  const forums = [
    {
      id: 'first-trimester-support',
      title: 'First Trimester Support',
      description: 'Share experiences and get support during the first trimester',
      categoryId: 'pregnancy-discussions',
      createdById: user.id,
    },
    {
      id: 'trying-to-conceive',
      title: 'Trying to Conceive',
      description: 'Support group for those trying to conceive',
      categoryId: 'fertility-support',
      createdById: user.id,
    },
    {
      id: 'newborn-care',
      title: 'Newborn Care Tips',
      description: 'Share tips and advice for newborn care',
      categoryId: 'parenting-advice',
      createdById: user.id,
    },
    {
      id: 'pregnancy-nutrition',
      title: 'Pregnancy Nutrition',
      description: 'Discuss nutrition and diet during pregnancy',
      categoryId: 'health-wellness',
      createdById: user.id,
    },
  ]

  // Create forums
  for (const forumData of forums) {
    await prisma.forums.upsert({
      where: { id: forumData.id },
      update: forumData,
      create: forumData as any,
    })
    console.log(`✅ Created forum: ${forumData.title}`)
  }

  // Create forum threads
  const threads = [
    {
      id: 'morning-sickness-tips',
      title: 'Morning Sickness Tips',
      content: 'What are your best tips for dealing with morning sickness? I\'m really struggling with nausea in the first trimester.',
      forumId: 'first-trimester-support',
      authorId: user.id,
    },
    {
      id: 'ovulation-tracking',
      title: 'Ovulation Tracking Methods',
      content: 'What methods have worked best for you when tracking ovulation? I\'m currently using OPKs but would love to hear about other approaches.',
      forumId: 'trying-to-conceive',
      authorId: user.id,
    },
    {
      id: 'sleep-schedule-help',
      title: 'Help with Newborn Sleep Schedule',
      content: 'My newborn is 2 weeks old and we\'re struggling with sleep. Any advice on establishing a good sleep routine?',
      forumId: 'newborn-care',
      authorId: user.id,
    },
    {
      id: 'iron-rich-foods',
      title: 'Iron-Rich Foods During Pregnancy',
      content: 'Looking for suggestions for iron-rich foods that are easy to incorporate into meals. My iron levels are a bit low.',
      forumId: 'pregnancy-nutrition',
      authorId: user.id,
    },
  ]

  // Create threads
  for (const threadData of threads) {
    await prisma.forum_threads.upsert({
      where: { id: threadData.id },
      update: threadData,
      create: threadData as any,
    })
    console.log(`✅ Created thread: ${threadData.title}`)
  }

  // Create forum posts (comments)
  const posts = [
    {
      id: 'post-morning-sickness-1',
      content: 'Ginger tea and crackers by the bed really helped me! Try eating small, frequent meals throughout the day.',
      threadId: 'morning-sickness-tips',
      authorId: user.id,
    },
    {
      id: 'post-morning-sickness-2',
      content: 'Sea bands worked wonders for me. Also, staying hydrated with small sips of water throughout the day.',
      threadId: 'morning-sickness-tips',
      authorId: user.id,
    },
    {
      id: 'post-ovulation-1',
      content: 'I found temping combined with OPKs gave me the most accurate picture. The Fertility Friend app was really helpful!',
      threadId: 'ovulation-tracking',
      authorId: user.id,
    },
    {
      id: 'post-sleep-1',
      content: 'Try establishing a consistent bedtime routine - bath, feeding, swaddle, and white noise. It takes time but really helps!',
      threadId: 'sleep-schedule-help',
      authorId: user.id,
    },
    {
      id: 'post-iron-1',
      content: 'Spinach smoothies with orange juice (vitamin C helps iron absorption) and lentils in soups are my go-to iron sources.',
      threadId: 'iron-rich-foods',
      authorId: user.id,
    },
  ]

  // Create posts
  for (const postData of posts) {
    await prisma.forumPost.upsert({
      where: { id: postData.id },
      update: postData,
      create: postData,
    })
    console.log(`✅ Created post in thread`)
  }

  console.log('🎉 Forum data seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
