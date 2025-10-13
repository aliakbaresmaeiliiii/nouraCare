const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugForums() {
  try {
    const categoryId = 'f45d0944-5eea-4e35-a0f4-6e1124c87931';
    
    console.log('=== Debugging Forum Creation ===');
    
    // Check if category exists
    const category = await prisma.forumCategory.findUnique({
      where: { id: categoryId }
    });
    
    console.log('Category found:', category);
    
    // Check if any forums exist in this category
    const forums = await prisma.forum.findMany({
      where: { categoryId }
    });
    
    console.log('Forums in category:', forums);
    
    // Check if we have any users
    const users = await prisma.user.findMany({
      take: 5
    });
    
    console.log('Available users:', users);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugForums();
