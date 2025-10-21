# Forum Like/Dislike System Implementation

## Overview

This document describes the improved like/dislike system for forum comments that addresses the issues with the previous implementation.

## Problems with Previous Implementation

1. **Inconsistent approach**: Separate like systems for posts and comments
2. **Missing dislike functionality**: Only likes were implemented
3. **Separate endpoints**: Likes were handled separately from comment retrieval
4. **No unified response**: When getting comments, like/dislike data didn't come together

## New Implementation Features

### 1. Enhanced Data Model
- Added `isLike` boolean field to `ForumCommentLike` model
- Supports both likes (true) and dislikes (false)
- Maintains unique constraint per user per comment

### 2. Unified Reaction System
- Single endpoint for both likes and dislikes
- Toggle functionality: clicking same reaction removes it
- Switching between like/dislike updates existing reaction

### 3. Integrated Response
- Comments now include like/dislike counts and user's reaction
- No need for separate API calls to get reaction data
- Optimized database queries with proper indexing

## API Endpoints

### Toggle Comment Reaction
```http
POST /api/v1/forum/comment/:id/reaction
Authorization: Bearer <token>
Content-Type: application/json

{
  "isLike": true  // true for like, false for dislike
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reaction updated successfully",
  "data": {
    "likeCount": 5,
    "dislikeCount": 2,
    "userReaction": true
  }
}
```

### Get Comment Reactions
```http
GET /api/v1/forum/comment/:id/reactions
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reactions": [
      {
        "id": "uuid",
        "isLike": true,
        "createdAt": "2025-01-20T10:30:00.000Z",
        "user": {
          "id": 1,
          "name": "John Doe",
          "profileImage": "url"
        }
      }
    ],
    "likeCount": 5,
    "dislikeCount": 2
  }
}
```

### Get Comments with Reactions
```http
GET /api/v1/forum/thread/:threadId/comments-with-reactions
Authorization: Bearer <token>  // Optional
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "comment-uuid",
      "content": "Comment content",
      "createdAt": "2025-01-20T10:30:00.000Z",
      "author": {
        "id": 1,
        "name": "John Doe",
        "profileImage": "url"
      },
      "likeCount": 5,
      "dislikeCount": 2,
      "userReaction": true,
      "replies": [...],
      "_count": {
        "replies": 3,
        "likes": 7
      }
    }
  ]
}
```

## Database Schema Changes

```prisma
model ForumCommentLike {
  id        String       @id @default(uuid())
  commentId String
  userId    Int
  isLike    Boolean      @default(true) // true for like, false for dislike
  createdAt DateTime     @default(now())
  comment   ForumComment @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user      user         @relation("ForumCommentLikes", fields: [userId], references: [id])

  @@unique([commentId, userId])
  @@index([userId])
  @@index([commentId, isLike])
  @@map("forum_comment_likes")
}
```

## Key Benefits

1. **Unified System**: Single table handles both likes and dislikes
2. **Efficient Queries**: Proper indexing for performance
3. **Better UX**: Reactions come with comments, no extra API calls needed
4. **Scalable**: Easy to extend with additional reaction types
5. **Consistent**: Same pattern can be applied to posts and other entities

## Implementation Notes

- The system uses a toggle mechanism: clicking the same reaction removes it
- Switching between like/dislike updates the existing record
- Reaction counts are calculated efficiently using database counts
- User's current reaction is included in comment responses when authenticated

## Migration Steps

1. Update Prisma schema with new `isLike` field
2. Run `npx prisma generate` to update client
3. Deploy database migration
4. Update frontend to use new endpoints

## Testing

Test the implementation using the provided HTTP endpoints:

```bash
# Toggle like on a comment
curl -X POST http://localhost:3000/api/v1/forum/comment/comment-uuid/reaction \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"isLike": true}'

# Get comments with reactions
curl -X GET http://localhost:3000/api/v1/forum/thread/thread-uuid/comments-with-reactions \
  -H "Authorization: Bearer <token>"
```

This implementation provides a solid foundation for a modern forum reaction system that is both efficient and user-friendly.
