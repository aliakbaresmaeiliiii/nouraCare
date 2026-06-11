# Forum Threads API Documentation

This API provides endpoints for managing forum threads (topics) in the DoreHealth application.

## Base URL
```
http://localhost:3000/api/v1/forum-threads
```

## Endpoints

### 1. Create a Forum Thread
**POST** `/`

Create a new forum thread.

**Request Body:**
```json
{
  "title": "Best natural remedies for period cramps",
  "content": "I've been experiencing severe cramps lately and looking for natural remedies...",
  "forumId": "uuid-of-forum",
  "isPinned": false,
  "isLocked": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Forum thread created successfully",
  "data": {
    "id": "thread-uuid",
    "title": "Best natural remedies for period cramps",
    "content": "I've been experiencing severe cramps lately and looking for natural remedies...",
    "forumId": "uuid-of-forum",
    "authorId": 1,
    "isPinned": false,
    "isLocked": false,
    "viewCount": 0,
    "createdAt": "2025-09-23T08:30:00.000Z",
    "updatedAt": "2025-09-23T08:30:00.000Z",
    "author": {
      "id": 1,
      "name": "Sarah Johnson",
      "profileImage": "assets/images/nurse.png"
    },
    "forum": {
      "id": "uuid-of-forum",
      "title": "General Discussion",
      "category": {
        "id": "category-uuid",
        "name": "General Discussion",
        "slug": "general-discussion"
      }
    },
    "_count": {
      "posts": 0
    }
  }
}
```

### 2. Get All Forum Threads
**GET** `/`

Get all forum threads with pagination.

**Query Parameters:**
- `forumId` (optional): Filter by forum ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "threads": [
      {
        "id": "thread-uuid",
        "title": "Best natural remedies for period cramps",
        "content": "I've been experiencing severe cramps lately...",
        "forumId": "uuid-of-forum",
        "authorId": 1,
        "isPinned": true,
        "isLocked": false,
        "viewCount": 156,
        "createdAt": "2025-09-22T00:00:00.000Z",
        "updatedAt": "2025-09-23T08:30:00.000Z",
        "author": {
          "id": 1,
          "name": "Sarah Johnson",
          "profileImage": "assets/images/nurse.png"
        },
        "forum": {
          "id": "uuid-of-forum",
          "title": "General Discussion",
          "category": {
            "id": "category-uuid",
            "name": "General Discussion",
            "slug": "general-discussion"
          }
        },
        "_count": {
          "posts": 23
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

### 3. Get Threads by Category
**GET** `/category/:categoryId`

Get forum threads filtered by category ID.

**Path Parameters:**
- `categoryId`: The category ID

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

### 4. Search Threads
**GET** `/search`

Search threads by title or content.

**Query Parameters:**
- `q`: Search query
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

### 5. Get Thread by ID
**GET** `/:id`

Get a specific thread by ID. This endpoint also increments the view count.

**Path Parameters:**
- `id`: The thread ID

### 6. Update a Thread
**PATCH** `/:id`

Update a forum thread (only the author can update).

**Path Parameters:**
- `id`: The thread ID

**Request Body:**
```json
{
  "title": "Updated title",
  "content": "Updated content"
}
```

### 7. Delete a Thread
**DELETE** `/:id`

Delete a forum thread (only the author can delete).

**Path Parameters:**
- `id`: The thread ID

### 8. Pin/Unpin a Thread
**POST** `/:id/pin`

Toggle the pinned status of a thread.

### 9. Lock/Unlock a Thread
**POST** `/:id/lock`

Toggle the locked status of a thread.

## Database Relationships

The forum threads are structured with the following relationships:

```
ForumCategory (1) ← (many) Forum (1) ← (many) ForumThread (1) ← (many) ForumPost
```

- Each thread belongs to a forum
- Each forum belongs to a category
- Each thread has many posts (replies)
- Each thread has an author (user)

## Example Usage

### Creating a thread in "General Discussion" category:

1. First, get the forum ID for "General Discussion"
2. Create a thread with that forum ID

### Getting threads for a specific category:

```http
GET /api/v1/forum-threads/category/general-discussion-category-id?page=1&limit=10
```

### Searching for threads about "period cramps":

```http
GET /api/v1/forum-threads/search?q=period+cramps&page=1&limit=10
```

## Authentication Note

The current implementation uses a placeholder user ID (`req.user?.id || 1`). In a production environment, you should implement proper authentication middleware to get the actual user ID from the JWT token or session.
