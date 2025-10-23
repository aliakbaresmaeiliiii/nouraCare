const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing the complete flow with correct field names...')
  
  // Test 1: What you're doing (WRONG)
  console.log('\n❌ WRONG: Sending forumId')
  const wrongRequest = {
    title: "dfsfasdfasdf",
    description: "asdfasdfasdfasdfasdf",
    forumId: "f0b9c533-5ef4-45da-8b1f-6aef4b46a567", // This is wrong
    tags: ["cramps"]
  }
  
  console.log('Request:', wrongRequest)
  console.log('Result: Will fail because forumId is not a valid forum ID')
  
  // Test 2: What you should do (CORRECT)
  console.log('\n✅ CORRECT: Sending categoryId')
  const correctRequest = {
    title: "dfsfasdfasdf",
    description: "asdfasdfasdfasdfasdf",
    categoryId: "f0b9c533-443e-464a-95ef-7dab41aa5886", // This is correct
    tags: ["cramps"]
  }
  
  console.log('Request:', correctRequest)
  
  try {
    // This is what the service does
    const category = await prisma.forumCategory.findUnique({
      where: { id: correctRequest.categoryId }
    })
    
    if (!category) {
      console.log('❌ Category not found')
      return
    }
    
    console.log('✅ Category found:', category.name)
    
    // Find or create forum
    let forum = await prisma.forums.findFirst({
      where: { categoryId: correctRequest.categoryId }
    })
    
    if (!forum) {
      console.log('📝 Creating forum...')
      const { v4: uuidv4 } = require('uuid')
      forum = await prisma.forums.create({
        data: {
          id: uuidv4(),
          title: `${category.name} Discussions`,
          description: `Discussion forum for ${category.name}`,
          categoryId: correctRequest.categoryId,
          createdById: 1,
          updatedAt: new Date(),
        }
      })
    }
    
    console.log('✅ Using forum:', forum.title)
    
    // Create thread
    const { v4: uuidv4 } = require('uuid')
    const threadId = uuidv4()
    
    const thread = await prisma.forum_threads.create({
      data: {
        title: correctRequest.title,
        content: correctRequest.description,
        forumId: forum.id,
        authorId: 1,
        id: threadId,
        updatedAt: new Date(),
      }
    })
    
    console.log('🎉 Thread created successfully!')
    console.log('Thread ID:', thread.id)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

main().finally(() => prisma.$disconnect())
