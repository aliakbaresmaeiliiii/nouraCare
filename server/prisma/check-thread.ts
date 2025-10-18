import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const threadId = '0b224a71-a729-4e78-aefd-8464236f2ff0'
  
  console.log(`🔍 Checking for thread with ID: ${threadId}`)
  
  const thread = await prisma.forum_thread.findUnique({
    where: { id: threadId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      forum_categories: true,
    },
  })

  if (thread) {
    console.log('✅ Thread found:')
    console.log(`   - Title: ${thread.title}`)
    console.log(`   - Description: ${thread.description}`)
    console.log(`   - Category: ${thread.forum_categories?.name}`)
    console.log(`   - Author: ${thread.user?.name} (${thread.user?.email})`)
    console.log(`   - Created: ${thread.createdAt}`)
  } else {
    console.log('❌ Thread not found')
    console.log('📋 Listing all available threads:')
    
    const allThreads = await prisma.forum_thread.findMany({
      take: 5,
      select: {
        id: true,
        title: true,
        categoryId: true,
      },
    })
    
    if (allThreads.length === 0) {
      console.log('   No threads found in database')
    } else {
      allThreads.forEach(t => {
        console.log(`   - ID: ${t.id}, Title: ${t.title}`)
      })
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Error checking thread:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
