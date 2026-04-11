# Forum Module

This module provides forum functionality for the Muslim Kids application, including forum categories, forums, threads, and posts.

## Database Schema

The forum module includes the following models:

### ForumCategory
- `id` (UUID) - Primary key
- `name` - Category name
- `description` - Category description
- `slug` - URL-friendly slug (unique)
- `color` - Optional hex color for UI
- `icon` - Optional icon for UI
- `order` - Display order
- `isActive` - Active status
- `createdAt` / `updatedAt` - Timestamps

### Forum
- `id` (UUID) - Primary key
- `title` - Forum title
- `description` - Forum description
- `categoryId` - Foreign key to ForumCategory
- `createdById` - Foreign key to User
- `isPublic` - Public/private forum
- `isActive` - Active status
- `createdAt` / `updatedAt` - Timestamps

### ForumThread
- `id` (UUID) - Primary key
- `title` - Thread title
- `content` - Thread content
- `forumId` - Foreign key to Forum
- `authorId` - Foreign key to User
- `isPinned` - Pinned status
- `isLocked` - Locked status
- `viewCount` - View counter
- `createdAt` / `updatedAt` - Timestamps

### ForumPost
- `id` (UUID) - Primary key
- `content` - Post content
- `threadId` - Foreign key to ForumThread
- `authorId` - Foreign key to User
- `parentId` - For nested replies (optional)
- `isDeleted` - Soft delete flag
- `createdAt` / `updatedAt` - Timestamps

### ForumPostLike
- `id` (UUID) - Primary key
- `postId` - Foreign key to ForumPost
- `userId` - Foreign key to User
- `createdAt` - Timestamp

## API Endpoints

### Forum Categories

#### GET /forum-categories
Get all active forum categories with their forums.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Category Name",
      "description": "Category description",
      "slug": "category-slug",
      "color": "#FF6B9D",
      "icon": "🤰",
      "order": 1,
      "isActive": true,
      "createdAt": "2025-09-22T13:48:29.010Z",
      "updatedAt": "2025-09-22T13:48:57.169Z",
      "forums": []
    }
  ]
}
```

#### GET /forum-categories/:id
Get a specific forum category by ID.

#### GET /forum-categories/slug/:slug
Get a specific forum category by slug.

#### POST /forum-categories
Create a new forum category.

**Body:**
```json
{
  "name": "Category Name",
  "description": "Category description",
  "slug": "category-slug",
  "color": "#FF6B9D",
  "icon": "🤰",
  "order": 1,
  "isActive": true
}
```

#### PATCH /forum-categories/:id
Update a forum category.

#### DELETE /forum-categories/:id
Delete a forum category (only if it has no forums).

#### POST /forum-categories/:id/deactivate
Deactivate a forum category.

#### GET /forum-categories/:id/stats
Get category statistics (total forums, total threads).

## Seed Data

The forum categories are pre-seeded with the following categories:

1. 🤰 Pregnancy Journey
2. 💕 Trying to Conceive
3. 👶 New Parents
4. 💪 Health & Wellness
5. 👨‍👩‍👧‍👦 Relationships & Family
6. 🛍️ Product Reviews
7. 📖 Birth Stories
8. ❓ Ask the Community

## Usage Examples

### Get all categories:
```bash
curl http://localhost:8080/forum-categories
```

### Get category by slug:
```bash
curl http://localhost:8080/forum-categories/slug/pregnancy-journey
```

### Create new category:
```bash
curl -X POST http://localhost:8080/forum-categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Category",
    "description": "New category description",
    "slug": "new-category",
    "color": "#FF0000",
    "icon": "🌟",
    "order": 9
  }'
```

## Future Enhancements

- Forum moderation features
- Thread and post management
- User permissions and roles
- Search functionality
- File attachments
- Notifications
- Real-time updates
