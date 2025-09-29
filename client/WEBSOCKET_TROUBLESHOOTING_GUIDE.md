# WebSocket Troubleshooting Guide

## Issue: WebSocket Connected but No Real-Time Updates

### 1. Check Backend WebSocket Events
The most likely issue is that your backend is not emitting WebSocket events when posts/comments are created or deleted.

**Backend Requirements:**
- Your backend must emit these events:
  - `postCreated` - When a new post is created
  - `commentCreated` - When a new comment is created  
  - `postDeleted` - When a post is deleted
  - `commentDeleted` - When a comment is deleted

**Check Backend Code:**
```javascript
// Example backend code (Node.js/Express)
io.on('connection', (socket) => {
  // When a post is created
  socket.on('createPost', (data) => {
    // Save post to database
    const newPost = await savePost(data);
    
    // Emit to all clients in the thread room
    io.to(data.threadId).emit('postCreated', newPost);
  });
  
  // When a comment is created
  socket.on('createComment', (data) => {
    // Save comment to database
    const newComment = await saveComment(data);
    
    // Emit to all clients in the thread room
    io.to(data.threadId).emit('commentCreated', newComment);
  });
});
```

### 2. Debug Steps

#### Step 1: Verify WebSocket Connection
1. Open browser developer tools console
2. Look for these messages:
   ```
   🔌 WebSocketService: Initializing WebSocket connection...
   ✅ WebSocketService: Connected to WebSocket server
   🔌 WebSocketService: Socket ID: [socket-id]
   ```

#### Step 2: Verify Room Joining
1. Navigate to a forum thread
2. Check console for:
   ```
   🔌 WebSocketService: Joined thread room: [thread-id]
   ```

#### Step 3: Test Manual Refresh
1. Click the refresh button (🔄) in the topic header
2. You should see:
   ```
   🔄 TopicDetail: Manual refresh triggered
   Refreshing topic... (toast message)
   ```

#### Step 4: Check Network Tab
1. Go to Network tab in developer tools
2. Filter by "WS" (WebSocket)
3. You should see a WebSocket connection
4. Click on it and check the "Messages" tab for incoming events

### 3. Test Scenarios

#### Scenario A: Create a Forum Post
1. **From another browser/device**, create a new forum post
2. **Check backend logs** - Is the backend emitting the WebSocket event?
3. **Check frontend console** - Do you see:
   ```
   📨 WebSocketService: Received postCreated event: {...}
   📨 Forums: Received postCreated event: {...}
   📨 Forums: Handling post creation: {...}
   ```
4. **Check forums page** - Does the new post appear immediately in the topics list?

#### Scenario B: Create a Comment
1. **From another browser/device**, create a comment on a post
2. **Check backend logs** - Is the backend emitting the WebSocket event?
3. **Check frontend console** - Do you see:
   ```
   📨 WebSocketService: Received commentCreated event: {...}
   📨 TopicDetail: Received commentCreated event: {...}
   📨 TopicDetail: Handling comment creation: {...}
   ```
4. **Check topic detail page** - Does the new comment appear immediately?

#### Scenario C: Delete a Post/Comment
1. **From another browser/device**, delete a post or comment
2. **Check backend logs** - Is the backend emitting the WebSocket event?
3. **Check frontend console** - Do you see:
   ```
   📨 WebSocketService: Received postDeleted/commentDeleted event: {...}
   ```

### 4. Common Backend Issues

#### Issue 1: Backend Not Emitting Events
**Solution:** Ensure your backend emits events after database operations:
```javascript
// After creating a post
io.to(threadId).emit('postCreated', newPost);

// After creating a comment  
io.to(threadId).emit('commentCreated', newComment);

// After deleting a post
io.to(threadId).emit('postDeleted', { postId: deletedPostId });

// After deleting a comment
io.to(threadId).emit('commentDeleted', { commentId: deletedCommentId });
```

#### Issue 2: Wrong Room/Namespace
**Solution:** Ensure clients join the correct room:
```javascript
// Frontend joins room
socket.emit('joinThread', threadId);

// Backend handles room joining
socket.on('joinThread', (threadId) => {
  socket.join(threadId);
});
```

#### Issue 3: CORS Issues
**Solution:** Ensure CORS is configured for WebSocket connections:
```javascript
// Backend CORS configuration
const io = new Server(server, {
  cors: {
    origin: "http://172.20.10.2:8100", // Your frontend URL
    methods: ["GET", "POST"]
  }
});
```

### 5. Frontend Debug Commands

You can test the WebSocket connection manually in browser console:

```javascript
// Check WebSocket service status
const wsService = injector.get(WebSocketService);
console.log('WebSocket connected:', wsService.getConnectionStatus());

// Manually trigger a test event (if backend supports it)
wsService.socket.emit('testEvent', { message: 'test' });
```

### 6. Expected Console Output

**Successful Connection:**
```
🔌 WebSocketService: Initializing WebSocket connection...
🔌 WebSocketService: Connecting to: http://172.20.10.2:8080
🔌 WebSocketService: Event listeners setup complete
✅ WebSocketService: Connected to WebSocket server
🔌 WebSocketService: Socket ID: abc123
```

**When Creating Forum Post:**
```
📨 WebSocketService: Received postCreated event: {id: "post-456", title: "New Post", ...}
📨 Forums: Received postCreated event: {id: "post-456", title: "New Post", ...}
📨 Forums: Handling post creation: {id: "post-456", title: "New Post", ...}
```

**When Creating Comment:**
```
📨 WebSocketService: Received commentCreated event: {id: "comment-789", content: "New comment", ...}
📨 TopicDetail: Received commentCreated event: {id: "comment-789", content: "New comment", ...}
📨 TopicDetail: Handling comment creation: {id: "comment-789", content: "New comment", ...}
```

**When Deleting:**
```
📨 WebSocketService: Received postDeleted event: {postId: "post-456"}
📨 WebSocketService: Received commentDeleted event: {commentId: "comment-789"}
```

### 7. Next Steps

If you're still not seeing real-time updates:

1. **Check backend WebSocket implementation** - Ensure events are being emitted
2. **Verify room joining** - Ensure clients are joining the correct rooms
3. **Test with a simple WebSocket client** - Use a tool like Postman WebSocket to test backend events
4. **Check browser network tab** - Look for WebSocket connection and messages

The frontend WebSocket implementation is complete and working. The issue is likely on the backend side where WebSocket events need to be emitted when posts/comments are created or deleted.
