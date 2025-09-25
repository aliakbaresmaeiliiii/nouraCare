# Forum Comments System Guide

## Overview

The forum comment system is already fully implemented and functional. When you navigate through the forum hierarchy (Category → Forum → Thread/Topic), the comment functionality is automatically available for each topic.

## Forum Structure

```
Forum Category
├── Forum
│   ├── Thread/Topic 1
│   │   ├── Post/Comment 1 (main comment)
│   │   │   ├── Reply 1.1
│   │   │   └── Reply 1.2
│   │   └── Post/Comment 2
│   └── Thread/Topic 2
└── Forum
```

## API Endpoints for Comments

### 1. Get Thread Details with Comments
**GET** `/api/v1/forum-threads/:threadId`

Returns the thread details along with all comments/posts in hierarchical format.

**Response Example:**
```json
{
  "success": true,
  "data": {
    "id": "thread-uuid",
    "title": "Thread Title",
    "content": "Thread content...",
    "posts": [
      {
        "id": "post-uuid",
        "content": "Main comment content",
        "author": { "id": 1, "name": "User Name", "profileImage": "url" },
        "replies": [
          {
            "id": "reply-uuid",
            "content": "Reply content",
            "author": { "id": 2, "name": "Another User", "profileImage": "url" }
          }
        ]
      }
    ]
  }
}
```

### 2. Create a New Comment
**POST** `/api/v1/forum-posts`

**Request Body:**
```json
{
  "content": "Your comment text here",
  "threadId": "thread-uuid"
}
```

### 3. Create a Reply to a Comment
**POST** `/api/v1/forum-posts`

**Request Body:**
```json
{
  "content": "Your reply text here",
  "threadId": "thread-uuid",
  "parentId": "parent-post-uuid"
}
```

### 4. Get All Comments for a Thread
**GET** `/api/v1/forum-posts/thread/:threadId`

### 5. Get Replies for a Specific Comment
**GET** `/api/v1/forum-posts/replies/:parentId`

### 6. Like/Unlike a Comment
**POST** `/api/v1/forum-posts/:postId/like`

### 7. Update a Comment
**PATCH** `/api/v1/forum-posts/:postId`

### 8. Delete a Comment
**DELETE** `/api/v1/forum-posts/:postId`

## Frontend Integration

### Getting Topic Details with Comments
When a user clicks on a topic, make a GET request to:
```
GET /api/v1/forum-threads/{threadId}
```

This returns the topic details along with all comments in a hierarchical structure.

### Adding a New Comment
When a user submits a comment, make a POST request to:
```
POST /api/v1/forum-posts
Content-Type: application/json

{
  "content": "Comment text",
  "threadId": "thread-uuid"
}
```

### Replying to a Comment
When replying to an existing comment, include the `parentId`:
```
POST /api/v1/forum-posts
Content-Type: application/json

{
  "content": "Reply text",
  "threadId": "thread-uuid",
  "parentId": "parent-post-uuid"
}
```

## Features Already Implemented

✅ **Hierarchical Comments** - Comments can have nested replies  
✅ **Like System** - Users can like/unlike comments  
✅ **User Authentication** - Comments are tied to user accounts  
✅ **Thread Locking** - Prevent new comments on locked threads  
✅ **Pagination** - Support for large comment threads  
✅ **Search** - Search within thread comments  
✅ **User Profiles** - Display comment author information  
✅ **Real-time Updates** - Comment counts and like counts  

## Testing the Implementation

Use the provided test files:
- `test-forum-threads.http` - For thread operations
- `test-forum-replies.http` - For comment/reply operations

## Example Flow

1. **User navigates**: Category → Forum → Topic
2. **Frontend calls**: `GET /api/v1/forum-threads/{topicId}`
3. **Backend returns**: Topic details + all comments (hierarchically structured)
4. **User adds comment**: Frontend calls `POST /api/v1/forum-posts`
5. **System updates**: New comment appears in the thread

The comment system is production-ready and follows best practices for forum functionality.
