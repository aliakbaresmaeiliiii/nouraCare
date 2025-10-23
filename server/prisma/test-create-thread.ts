import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing create thread functionality...')
  
  // Use an existing category ID from our database
  const categoryId = 'f0b9c533-443e-464a-95ef-7dab41aa5886' // Pregnancy & Fertility category
  const authorId = 1 // User ID 1 exists
  
  console.log(`\n📝 Creating thread with:`)
  console.log(`- Category ID: ${categoryId}`)
  console.log(`- Author ID: ${authorId}`)
  console.log(`- Title: "First title for pregnancy"`)
  console.log(`- Description: "First content for pregnancy"`)
  console.log(`- Tags: ["cramps"]`)
  
  try {
    // First check if category exists
    const category = await prisma.forumCategory.findUnique({
      where: { id: categoryId }
    })
    
    if (!category) {
      console.log('❌ Category not found')
      return
    }
    
    console.log(`✅ Category found: ${category.name}`)
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: authorId }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log(`✅ User found: ID ${user.id}`)
    
    // Find or create a forum for this category
    let forum = await prisma.forums.findFirst({
      where: { categoryId: categoryId }
    })
    
    if (!forum) {
      console.log('📝 No forum found, creating one...')
      const { v4: uuidv4 } = require('uuid')
      forum = await prisma.forums.create({
        data: {
          id: uuidv4(),
          title: `${category.name} Discussions`,
          description: `Discussion forum for ${category.name}`,
          categoryId: categoryId,
          createdById: authorId,
          updatedAt: new Date(),
        } as any
      })
      console.log(`✅ Created forum: ${forum.title}`)
    } else {
      console.log(`✅ Forum found: ${forum.title}`)
    }
    
    // Create the thread
    const { v4: uuidv4 } = require('uuid')
    const threadId = uuidv4()
    
    const thread = await prisma.forum_threads.create({
      data: {
        title: "First title for pregnancy",
        content: "First content for pregnancy",
        forumId: forum.id,
        authorId: authorId,
        id: threadId,
        updatedAt: new Date(),
      } as any,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        forums: {
          include: {
            forum_categories: true,
          },
        },
      },
    })
    
    console.log('\n🎉 Thread created successfully!')
    console.log(`- Thread ID: ${thread.id}`)
    console.log(`- Title: ${thread.title}`)
    console.log(`- Forum: ${thread.forums.title}`)
    console.log(`- Category: ${thread.forums.forum_categories.name}`)
    
  } catch (error) {
    console.error('❌ Error creating thread:', error)
  }
}

main().finally(() => prisma.$disconnect())
