import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('📊 Checking forum categories and forums...')
  
  const categories = await prisma.forumCategory.findMany()
  console.log('\n📁 Forum Categories:')
  categories.forEach(cat => {
    console.log(`- ID: ${cat.id}, Name: ${cat.name}, Slug: ${cat.slug}`)
  })
  
  const forums = await prisma.forums.findMany({
    include: { forum_categories: true }
  })
  console.log('\n📝 Forums:')
  forums.forEach(forum => {
    console.log(`- ID: ${forum.id}, Title: ${forum.title}, Category: ${forum.forum_categories.name}`)
  })
  
  console.log('\n👤 Users (first 5):')
  const users = await prisma.user.findMany({ take: 5 })
  users.forEach(user => {
    console.log(`- ID: ${user.id}, Name: ${user.name}`)
  })
}

main().finally(() => prisma.$disconnect())
