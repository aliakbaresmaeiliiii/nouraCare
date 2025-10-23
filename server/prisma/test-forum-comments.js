const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing forum comments functionality...')
  
  try {
    // First, let's check if we have any forum posts to test with
    const posts = await prisma.forumPost.findMany({
      take: 1,
      include: {
        forum_thread: true
      }
    })
    
    if (posts.length === 0) {
      console.log('❌ No forum posts found. Please create a forum post first.')
      return
    }
    
    const testPost = posts[0]
    console.log('✅ Found forum post:', testPost.id)
    
    // Test creating a comment
    console.log('\n📝 Testing comment creation...')
    const commentData = {
      content: 'This is a test comment for the forum post',
      postId: testPost.id,
      authorId: 1 // Assuming user ID 1 exists
    }
    
    const comment = await prisma.forum_comments.create({
      data: {
        id: require('uuid').v4(),
        content: commentData.content,
        postId: commentData.postId,
        authorId: commentData.authorId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    })
    
    console.log('✅ Comment created successfully!')
    console.log('Comment ID:', comment.id)
    console.log('Author:', comment.user.name)
    console.log('Content:', comment.content)
    
    // Test creating a reply
    console.log('\n📝 Testing reply creation...')
    const replyData = {
      content: 'This is a reply to the test comment',
      postId: testPost.id,
      authorId: 1,
      parentId: comment.id
    }
    
    const reply = await prisma.forum_comments.create({
      data: {
        id: require('uuid').v4(),
        content: replyData.content,
        postId: replyData.postId,
        authorId: replyData.authorId,
        parentId: replyData.parentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        parent: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
    })
    
    console.log('✅ Reply created successfully!')
    console.log('Reply ID:', reply.id)
    console.log('Parent Comment:', reply.parent.content)
    
    // Test liking a comment
    console.log('\n❤️ Testing comment like...')
    const like = await prisma.forum_comment_likes.create({
      data: {
        id: require('uuid').v4(),
        commentId: comment.id,
        userId: 1,
        createdAt: new Date(),
      },
      include: {
        comment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
            _count: {
              select: {
                likes: true,
                replies: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    })
    
    console.log('✅ Comment liked successfully!')
    console.log('Like ID:', like.id)
    console.log('Comment likes count:', like.comment._count.likes)
    
    // Test getting comments for post
    console.log('\n📋 Testing getting comments for post...')
    const postComments = await prisma.forum_comments.findMany({
      where: {
        postId: testPost.id,
        isDeleted: false,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
        replies: {
          where: { isDeleted: false },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
            _count: {
              select: {
                likes: true,
                replies: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            likes: true,
            replies: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    console.log('✅ Retrieved comments successfully!')
    console.log('Total comments:', postComments.length)
    postComments.forEach(c => {
      console.log(`- Comment: ${c.content} (${c._count.likes} likes, ${c._count.replies} replies)`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  }
}

main().finally(() => prisma.$disconnect())
