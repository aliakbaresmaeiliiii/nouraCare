import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking if first_name and last_name fields were added...')
  
  // Get the first user to check the structure
  const user = await prisma.user.findFirst()
  
  if (user) {
    console.log('✅ User found with fields:')
    console.log('- firstName:', user.firstName)
    console.log('- lastName:', user.lastName)
    console.log('- name:', user.name)
  } else {
    console.log('❌ No users found')
  }
}

main().finally(() => prisma.$disconnect())
