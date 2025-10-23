import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking what exists with ID: f0b9c533-443e-464a-95ef-7dab41aa5886')
  
  // Check if it's a category
  const category = await prisma.forumCategory.findUnique({
    where: { id: 'f0b9c533-443e-464a-95ef-7dab41aa5886' }
  })
  
  if (category) {
    console.log('✅ This is a CATEGORY:', category.name)
  }
  
  // Check if it's a forum
  const forum = await prisma.forums.findUnique({
    where: { id: 'f0b9c533-443e-464a-95ef-7dab41aa5886' }
  })
  
  if (forum) {
    console.log('✅ This is a FORUM:', forum.title)
  }
  
  // Check forums for this category
  const forumsInCategory = await prisma.forums.findMany({
    where: { categoryId: 'f0b9c533-443e-464a-95ef-7dab41aa5886' }
  })
  
  console.log('📝 Forums in this category:', forumsInCategory.length)
  forumsInCategory.forEach(f => {
    console.log(`  - ${f.id}: ${f.title}`)
  })
}

main().finally(() => prisma.$disconnect())
