const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing the exact scenario from your error...')
  
  // Simulate the EXACT request that's failing
  const requestData = {
    title: "dfsfasdfasdf",
    description: "asdfasdfasdfasdfasdf",
    forumId: "f0b9c533-5ef4-45da-8b1f-6aef4b46a567", // This is what you're sending
    tags: ["cramps"]
  }
  
  const authorId = 1
  
  console.log('📝 Request data (with forumId):', requestData)
  
  try {
    // This is what the service is trying to do
    console.log('🔍 Service logic: Looking for forum with ID:', requestData.forumId)
    
    // Check if this ID exists as a forum
    const forum = await prisma.forums.findUnique({
      where: { id: requestData.forumId }
    })
    
    if (forum) {
      console.log('✅ Found forum:', forum.title)
    } else {
      console.log('❌ No forum found with that ID')
      
      // Check if it's actually a category
      const category = await prisma.forumCategory.findUnique({
        where: { id: requestData.forumId }
      })
      
      if (category) {
        console.log('⚠️  This ID is actually a CATEGORY:', category.name)
        console.log('💡 Solution: Send categoryId instead of forumId')
      } else {
        console.log('❌ This ID is not a category either')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

main().finally(() => prisma.$disconnect())
