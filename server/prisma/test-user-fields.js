const { PrismaClient } = require('@prisma/client')
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
    
    // Try to update a user with first and last name
    console.log('\n📝 Testing update with first and last name...')
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: 'John',
        lastName: 'Doe'
      }
    })
    
    console.log('✅ User updated successfully:')
    console.log('- firstName:', updatedUser.firstName)
    console.log('- lastName:', updatedUser.lastName)
  } else {
    console.log('❌ No users found')
  }
}

main().finally(() => prisma.$disconnect())
