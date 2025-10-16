# Forum Refactored Structure

## Overview
The forum has been refactored to follow a clean, scalable structure with proper data relationships and authorization logic.

## Data Model

### Entities & Relationships
```
ForumCategory (1) → (N) ForumTopic (1) → (N) ForumPost (1) → (N) ForumComment
```

### Prisma Schema
```prisma
model ForumCategory {
  id          String      @id @default(uuid())
  name        String
  description String      @db.Text
  slug        String      @unique
  color       String?
  icon        String?
  order       Int         @default(0)
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  topics      ForumTopic[]
}

model ForumTopic {
  id          String      @id @default(uuid())
  title       String
  description String      @db.Text
  categoryId  String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  isActive    Boolean     @default(true)
  posts       ForumPost[]
  category    ForumCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
}

model ForumPost {
  id        String          @id @default(uuid())
  title     String
  content   String          @db.Text
  topicId   String
  userId    Int
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  isDeleted Boolean         @default(false)
  likes     ForumPostLike[]
  comments  ForumComment[]
  author    user            @relation(fields: [userId], references: [id])
  topic     ForumTopic      @relation(fields: [topicId], references: [id], onDelete: Cascade)
}

model ForumComment {
  id        String          @id @default(uuid())
  content   String          @db.Text
  postId    String
  userId    Int
  parentId  String?
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  isDeleted Boolean         @default(false)
  author    user            @relation(fields: [userId], references: [id])
  parent    ForumComment?   @relation("CommentReplies", fields: [parentId], references: [id])
  replies   ForumComment[]  @relation("CommentReplies")
  post      ForumPost       @relation(fields: [postId], references: [id], onDelete: Cascade)
}
```

## API Endpoints

### Categories
- `GET /api/v1/forum/categories` - List all categories

### Topics
- `GET /api/v1/forum/topics/:categoryId` - List topics for category (with pagination)

### Posts
- `GET /api/v1/forum/posts/:topicId` - List all posts for topic (with pagination)
- `GET /api/v1/forum/post/:id` - Get single post with its comments (nested tree)
- `POST /api/v1/forum/post` - Create a new post (authenticated)

### Comments
- `POST /api/v1/forum/comment` - Add comment or reply (detect parentId, authenticated)
- `PUT /api/v1/forum/comment/:id` - Edit comment (only by the owner, authenticated)
- `DELETE /api/v1/forum/comment/:id` - Delete comment (only by the owner, authenticated)

## Key Features

### Clean Data Relationships
- **One Category → Many Topics**
- **One Topic → Many Posts** 
- **One Post → Many Comments**
- **Comments can have nested replies** (via parentId)

### Authorization & Security
- JWT authentication required for write operations
- Users can only edit/delete their own comments and posts
- Soft deletion for posts and comments
- Proper ownership verification

### Performance Optimizations
- Efficient Prisma queries with `include` to avoid N+1 queries
- Pagination support for lists
- Count aggregations for statistics
- Proper indexing on foreign keys

### Data Integrity
- Foreign key constraints with cascade delete
- Soft deletion instead of hard delete
- Validation of parent-child relationships
- Verification of active/valid entities before operations

## Testing
Use the `test-forum-refactored.http` file to test all endpoints with proper authentication.

## Migration Notes
- Old forum structure (Forum → ForumThread → ForumPost) has been replaced
- New structure follows: ForumCategory → ForumTopic → ForumPost → ForumComment
- Comments now support nested replies via parentId
- Proper authorization logic implemented for all write operations
