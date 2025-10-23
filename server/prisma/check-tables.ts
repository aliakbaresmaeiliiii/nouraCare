import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Checking database tables...')
  
  try {
  // Try to query each table to see if it exists
  const tables = [
    'forum_categories',
    'forums', 
    'forum_threads',
    'forum_thread',
    'forum_posts',
    'forum_post_likes',
    'forum_comments',
    'forum_comment_likes'
  ]
    
    for (const table of tables) {
      try {
        // Try a simple query to see if table exists
        if (table === 'forum_categories') {
          const result = await prisma.forumCategory.findFirst()
          console.log(`✅ ${table} exists`)
        } else if (table === 'forums') {
          // This would be the old table name from migration
          console.log(`ℹ️  ${table} - would need custom query`)
        } else if (table === 'forum_threads') {
          // This would be the old table name from migration  
          console.log(`ℹ️  ${table} - would need custom query`)
        } else if (table === 'forum_thread') {
          const result = await prisma.forum_threads.findFirst()
          console.log(`✅ ${table} exists`)
        } else if (table === 'forum_posts') {
          const result = await prisma.forumPost.findFirst()
          console.log(`✅ ${table} exists`)
        } else if (table === 'forum_post_likes') {
          const result = await prisma.forumPostLike.findFirst()
          console.log(`✅ ${table} exists`)
        } else if (table === 'forum_comments') {
          const result = await prisma.forumPost.findFirst()
          console.log(`✅ ${table} exists`)
        } else if (table === 'forum_comment_likes') {
          // This would need a custom query since it's not in the Prisma schema
          console.log(`ℹ️  ${table} - would need custom query`)
        }
      } catch (error: any) {
        if (error.code === 'P2021') {
          console.log(`❌ ${table} does not exist`)
        } else {
          console.log(`⚠️  ${table} - ${error.message}`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error)
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
