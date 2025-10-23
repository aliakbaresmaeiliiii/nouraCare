const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing exact request scenario...')
  
  // Simulate the exact request data from the error
  const requestData = {
    title: "dfsfasdfasdf",
    description: "asdfasdfasdfasdfasdf",
    categoryId: "f0b9c533-443e-464a-95ef-7dab41aa5886", // This should be categoryId
    tags: ["cramps"]
  }
  
  const authorId = 1
  
  console.log('📝 Request data:', requestData)
  
  try {
    // Check category
    const category = await prisma.forumCategory.findUnique({
      where: { id: requestData.categoryId }
    })
    
    if (!category) {
      console.log('❌ Category not found')
      return
    }
    
    console.log('✅ Category found:', category.name)
    
    // Find forum for this category
    const forum = await prisma.forums.findFirst({
      where: { categoryId: requestData.categoryId }
    })
    
    console.log('🔍 Forum found:', forum)
    
    if (!forum) {
      console.log('❌ No forum found for this category')
      return
    }
    
    // Try to create thread with the forum ID
    const { v4: uuidv4 } = require('uuid')
    const threadId = uuidv4()
    
    console.log('📝 Creating thread with forumId:', forum.id)
    
    const thread = await prisma.forum_threads.create({
      data: {
        title: requestData.title,
        content: requestData.description,
        forumId: forum.id,
        authorId: authorId,
        id: threadId,
        updatedAt: new Date(),
      }
    })
    
    console.log('🎉 Thread created successfully!')
    console.log('Thread ID:', thread.id)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  }
}

main().finally(() => prisma.$disconnect())
