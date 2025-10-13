const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testForumLogic() {
  try {
    const categoryId = 'f45d0944-5eea-4e35-a0f4-6e1124c87931';
    const authorId = 11;
    
    console.log('=== Testing Exact Forum Logic ===');
    
    // Test the exact same query used in the service
    const forum = await prisma.forum.findFirst({
      where: { categoryId: categoryId },
    });
    
    console.log('Forum found with findFirst:', forum);
    
    if (!forum) {
      console.log('No forum found - this should trigger forum creation');
      
      // Test category lookup
      const category = await prisma.forumCategory.findUnique({
        where: { id: categoryId },
      });
      
      console.log('Category lookup result:', category);
      
      if (category) {
        // Test forum creation
        const newForum = await prisma.forum.create({
          data: {
            title: `${category.name} Forum`,
            description: `Default forum for ${category.name} category`,
            categoryId: categoryId,
            createdById: authorId,
          },
        });
        
        console.log('New forum created:', newForum);
      }
    } else {
      console.log('Forum found successfully, should proceed with thread creation');
    }
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testForumLogic();
