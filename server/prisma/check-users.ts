import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('👥 Checking for existing users...')
  
  const users = await prisma.user.findMany({
    take: 5,
    select: {
      id: true,
      email: true,
      name: true,
    }
  })

  if (users.length === 0) {
    console.log('❌ No users found in the database')
    console.log('💡 Please create at least one user first')
  } else {
    console.log(`✅ Found ${users.length} user(s):`)
    users.forEach(user => {
      console.log(`   - ID: ${user.id}, Name: ${user.name || 'N/A'}, Email: ${user.email}`)
    })
  }
}

main()
  .catch((e) => {
    console.error('❌ Error checking users:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
