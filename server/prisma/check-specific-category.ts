import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking category with ID: 53f88102-5ef4-45da-8b1f-6aef4b46a567')
  
  const category = await prisma.forumCategory.findUnique({
    where: { id: '53f88102-5ef4-45da-8b1f-6aef4b46a567' }
  })
  
  if (category) {
    console.log('✅ Category found:', category.name)
  } else {
    console.log('❌ Category not found with that ID')
    console.log('Available category IDs:')
    const allCategories = await prisma.forumCategory.findMany()
    allCategories.forEach(cat => {
      console.log(`- ${cat.id}: ${cat.name}`)
    })
  }
}

main().finally(() => prisma.$disconnect())
