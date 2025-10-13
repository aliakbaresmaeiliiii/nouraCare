const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFullFlow() {
  try {
    const categoryId = 'f45d0944-5eea-4e35-a0f4-6e1124c87931';
    const authorId = 11;
    
    console.log('=== Testing Full Forum Post Creation Flow ===');
    
    // Simulate the exact DTO you're sending
    const createForumPostDto = {
      content: 'Test post content',
      categoryId: categoryId,
      title: 'Test Thread Title',
      parentId: null
    };
    
    console.log('Simulating DTO:', createForumPostDto);
    
    let threadId = createForumPostDto.threadId;

    // If categoryId is provided but threadId is not, create a new thread
    if (createForumPostDto.categoryId && !threadId) {
      console.log('Entering category-based thread creation...');
      
      if (!createForumPostDto.title) {
        throw new Error('Title is required when creating a new thread');
      }

      // Find or create a forum in the specified category
      let forum = await prisma.forum.findFirst({
        where: { categoryId: createForumPostDto.categoryId },
      });

      console.log('Forum found:', forum);

      if (!forum) {
        console.log('No forum found, creating default forum...');
        // Create a default forum for this category
        const category = await prisma.forumCategory.findUnique({
          where: { id: createForumPostDto.categoryId },
        });

        if (!category) {
          throw new Error('Category not found');
        }

        forum = await prisma.forum.create({
          data: {
            title: `${category.name} Forum`,
            description: `Default forum for ${category.name} category`,
            categoryId: createForumPostDto.categoryId,
            createdById: authorId,
          },
        });
        
        console.log('New forum created:', forum);
      }

      // Create a new thread - use the title and content for the thread
      console.log('Creating new thread...');
      const newThread = await prisma.forumThread.create({
        data: {
          title: createForumPostDto.title,
          content: createForumPostDto.content, // Thread content is the post content
          forumId: forum.id,
          authorId,
        },
      });

      console.log('New thread created:', newThread);
      threadId = newThread.id;
    }

    // If threadId is still not set, throw error
    if (!threadId) {
      throw new Error('Either threadId or categoryId with title is required');
    }

    console.log('Thread ID to use:', threadId);

    // Check if thread exists
    const thread = await prisma.forumThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new Error('Forum thread not found');
    }

    console.log('Thread verified:', thread);

    // Create the post
    console.log('Creating forum post...');
    const createdPost = await prisma.forumPost.create({
      data: {
        content: createForumPostDto.content,
        threadId,
        authorId,
        parentId: createForumPostDto.parentId,
        isDeleted: false,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    console.log('SUCCESS! Post created:', createdPost);
    
  } catch (error) {
    console.error('ERROR:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testFullFlow();
