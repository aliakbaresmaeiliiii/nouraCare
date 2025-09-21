# Secret Chats API

A comprehensive Instagram-like secret chats system with posts, comments, likes, and real-time messaging capabilities.

## Features

### 🔐 Secret Chats
- Create private group chats or one-on-one conversations
- Role-based access control (Admin, Moderator, Member)
- Member management (add/remove members)
- Chat metadata (name, description, member count)

### 📝 Posts & Media
- Create posts with text content and media attachments
- Support for images, videos, audio, and documents
- Anonymous posting option
- Like/unlike posts
- Media upload with automatic type detection

### 💬 Comments System
- Nested comments (replies to comments)
- Like/unlike comments
- Anonymous commenting option
- Paginated comment loading

### 📱 Real-time Messages
- Text messages with emoji support
- Media messages (images, videos, audio, files)
- Reply to messages
- Message read receipts
- Message history with pagination

## Database Schema

### Core Models
- **SecretChat**: Chat rooms with metadata
- **ChatMember**: User membership in chats with roles
- **Post**: Instagram-like posts within chats
- **PostMedia**: Media attachments for posts
- **Comment**: Comments on posts with nested replies
- **PostLike**: Like system for posts
- **CommentLike**: Like system for comments
- **ChatMessage**: Real-time messages
- **MessageRead**: Read receipt tracking

### Enums
- **MemberRole**: ADMIN, MODERATOR, MEMBER
- **MediaType**: IMAGE, VIDEO, AUDIO, DOCUMENT
- **MessageType**: TEXT, IMAGE, VIDEO, AUDIO, DOCUMENT, SYSTEM

## API Endpoints

### Chat Management
```
POST   /api/v1/secret-chats              # Create new chat
GET    /api/v1/secret-chats              # Get user's chats
GET    /api/v1/secret-chats/:chatId      # Get chat details
PUT    /api/v1/secret-chats/:chatId      # Update chat info
POST   /api/v1/secret-chats/:chatId/members  # Add member
DELETE /api/v1/secret-chats/:chatId/members/:userId  # Remove member
POST   /api/v1/secret-chats/:chatId/leave    # Leave chat
```

### Posts & Media
```
POST   /api/v1/secret-chats/posts        # Create post
POST   /api/v1/secret-chats/posts/upload # Upload post media
GET    /api/v1/secret-chats/:chatId/posts # Get chat posts
POST   /api/v1/secret-chats/posts/:postId/like # Like/unlike post
```

### Comments
```
POST   /api/v1/secret-chats/comments     # Create comment
GET    /api/v1/secret-chats/posts/:postId/comments # Get post comments
POST   /api/v1/secret-chats/comments/:commentId/like # Like/unlike comment
```

### Messages
```
POST   /api/v1/secret-chats/messages     # Send message
POST   /api/v1/secret-chats/messages/upload # Upload message media
GET    /api/v1/secret-chats/:chatId/messages # Get chat messages
POST   /api/v1/secret-chats/messages/:messageId/read # Mark as read
```

## Usage Examples

### Creating a Secret Chat
```json
POST /api/v1/secret-chats
{
  "name": "Pregnancy Support Group",
  "description": "A safe space to share experiences",
  "isGroup": true,
  "memberIds": [2, 3, 4]
}
```

### Creating a Post with Media
```json
POST /api/v1/secret-chats/posts
{
  "content": "Sharing my pregnancy journey!",
  "chatId": "chat-uuid",
  "isAnonymous": false,
  "media": [
    {
      "url": "https://example.com/image.jpg",
      "type": "IMAGE",
      "caption": "Week 20 ultrasound"
    }
  ]
}
```

### Adding a Comment
```json
POST /api/v1/secret-chats/comments
{
  "content": "Congratulations! So exciting!",
  "postId": "post-uuid",
  "isAnonymous": false
}
```

### Sending a Message
```json
POST /api/v1/secret-chats/messages
{
  "content": "Hello everyone! 👋",
  "chatId": "chat-uuid",
  "messageType": "TEXT"
}
```

## Security Features

- **Member Verification**: All operations verify user membership
- **Role-Based Permissions**: Admins and moderators have enhanced privileges
- **Anonymous Options**: Users can post/comment anonymously
- **File Upload Validation**: Secure file upload with type and size restrictions
- **Soft Deletes**: Members can leave chats without losing message history

## File Upload Support

### Post Media
- **Allowed Types**: Images, videos, audio files
- **Max Size**: 10MB per file
- **Storage**: `server/public/uploads/posts/`

### Message Media
- **Allowed Types**: All file types
- **Max Size**: 25MB per file
- **Storage**: `server/public/uploads/messages/`

### Profile Images
- **Allowed Types**: Images only
- **Max Size**: 3MB per file
- **Storage**: `server/public/uploads/profile/`

## Response Format

All endpoints return JSON responses with consistent structure:

```json
{
  "id": "uuid",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  // ... other fields
}
```

## Authentication

**Note**: The current implementation assumes authentication is handled by middleware. You'll need to:

1. Implement JWT authentication guards
2. Add user context to requests
3. Protect all endpoints except test endpoints

## Testing Endpoints

For development/testing, temporary endpoints are available:

```
GET /api/v1/secret-chats/test/user/:userId
POST /api/v1/secret-chats/test/chat/:chatId/user/:userId
```

**⚠️ Remove these endpoints in production!**

## Installation & Setup

1. The database migration has been applied
2. The module is integrated into the main app
3. File upload directories will be created automatically
4. Ensure proper environment variables are set

## Next Steps

1. **Add Authentication Guards**: Implement JWT/session-based auth
2. **WebSocket Integration**: Add real-time message delivery
3. **Push Notifications**: Notify users of new messages/posts
4. **Content Moderation**: Add reporting and moderation features
5. **Analytics**: Track engagement and usage metrics

## Error Handling

The API includes comprehensive error handling:
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (not authenticated)
- **403**: Forbidden (not a chat member/insufficient permissions)
- **404**: Not Found (chat/post/comment doesn't exist)
- **500**: Internal Server Error

## Performance Considerations

- **Pagination**: All list endpoints support pagination
- **Lazy Loading**: Related data is loaded efficiently
- **Indexing**: Database indexes on frequently queried fields
- **File Storage**: Static files served separately for better performance
