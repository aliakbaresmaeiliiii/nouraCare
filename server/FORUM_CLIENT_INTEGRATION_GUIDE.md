# Forum Client-Side WebSocket Integration Guide

## Overview

To enable immediate data updates after deleting posts, you need to implement WebSocket client code in your frontend application. This guide explains how to integrate WebSocket functionality into your existing frontend.

## Required Client-Side Implementation

### 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

### 2. WebSocket Service (Recommended)

Create a WebSocket service to manage connections and events:

```typescript
// services/websocket.service.ts
import { io, Socket } from 'socket.io-client';

export class WebSocketService {
  private socket: Socket;
  private isConnected = false;

  constructor() {
    this.socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
    });
    
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Connected to WebSocket server');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('postDeleted', (data: { postId: string }) => {
      this.handlePostDeleted(data.postId);
    });

    this.socket.on('commentDeleted', (data: { commentId: string }) => {
      this.handleCommentDeleted(data.commentId);
    });
  }

  // Join thread room when viewing a thread
  joinThread(threadId: string): void {
    if (this.isConnected) {
      this.socket.emit('joinThread', threadId);
      console.log(`Joined thread room: ${threadId}`);
    }
  }

  // Leave thread room when navigating away
  leaveThread(threadId: string): void {
    if (this.isConnected) {
      this.socket.emit('leaveThread', threadId);
      console.log(`Left thread room: ${threadId}`);
    }
  }

  // Join post room when viewing a specific post
  joinPost(postId: string): void {
    if (this.isConnected) {
      this.socket.emit('joinPost', postId);
      console.log(`Joined post room: ${postId}`);
    }
  }

  // Leave post room when navigating away
  leavePost(postId: string): void {
    if (this.isConnected) {
      this.socket.emit('leavePost', postId);
      console.log(`Left post room: ${postId}`);
    }
  }

  private handlePostDeleted(postId: string): void {
    console.log(`Post deleted: ${postId}`);
    
    // Update your UI here
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (postElement) {
      postElement.classList.add('deleted');
      postElement.innerHTML += '<div class="deleted-message">This post has been deleted</div>';
    }

    // Or if using a state management system:
    // this.store.dispatch(new PostDeleted(postId));
  }

  private handleCommentDeleted(commentId: string): void {
    console.log(`Comment deleted: ${commentId}`);
    
    // Update your UI here
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (commentElement) {
      commentElement.classList.add('deleted');
      commentElement.innerHTML += '<div class="deleted-message">This comment has been deleted</div>';
    }
  }

  disconnect(): void {
    this.socket.disconnect();
  }
}
```

### 3. Integration with Your Components

#### React Example

```tsx
// components/ThreadView.tsx
import React, { useEffect, useState } from 'react';
import { WebSocketService } from '../services/websocket.service';

const ThreadView: React.FC<{ threadId: string }> = ({ threadId }) => {
  const [websocketService] = useState(() => new WebSocketService());

  useEffect(() => {
    // Join thread room when component mounts
    websocketService.joinThread(threadId);

    // Leave thread room when component unmounts
    return () => {
      websocketService.leaveThread(threadId);
    };
  }, [threadId, websocketService]);

  return (
    <div>
      {/* Your thread content */}
    </div>
  );
};
```

#### Vue.js Example

```vue
<!-- components/ThreadView.vue -->
<template>
  <div>
    <!-- Your thread content -->
  </div>
</template>

<script>
import { WebSocketService } from '../services/websocket.service';

export default {
  props: ['threadId'],
  data() {
    return {
      websocketService: null
    };
  },
  mounted() {
    this.websocketService = new WebSocketService();
    this.websocketService.joinThread(this.threadId);
  },
  beforeUnmount() {
    if (this.websocketService) {
      this.websocketService.leaveThread(this.threadId);
      this.websocketService.disconnect();
    }
  }
};
</script>
```

#### Angular Example

```typescript
// components/thread-view.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WebSocketService } from '../services/websocket.service';

@Component({
  selector: 'app-thread-view',
  templateUrl: './thread-view.component.html'
})
export class ThreadViewComponent implements OnInit, OnDestroy {
  threadId: string;

  constructor(
    private route: ActivatedRoute,
    private websocketService: WebSocketService
  ) {}

  ngOnInit(): void {
    this.threadId = this.route.snapshot.paramMap.get('threadId');
    this.websocketService.joinThread(this.threadId);
  }

  ngOnDestroy(): void {
    this.websocketService.leaveThread(this.threadId);
  }
}
```

### 4. UI Updates for Deleted Posts/Comments

Add CSS styles for deleted content:

```css
/* styles.css */
.post.deleted,
.comment.deleted {
  background-color: #ffe6e6;
  text-decoration: line-through;
  opacity: 0.7;
  pointer-events: none;
}

.deleted-message {
  color: #dc3545;
  font-style: italic;
  margin-top: 8px;
}
```

Update your HTML structure to include data attributes:

```html
<!-- Example post structure -->
<div class="post" data-post-id="123">
  <h3>Post Title</h3>
  <p>Post content...</p>
  <button onclick="deletePost('123')">Delete</button>
</div>

<!-- Example comment structure -->
<div class="comment" data-comment-id="456">
  <p>Comment content...</p>
  <button onclick="deleteComment('456')">Delete</button>
</div>
```

### 5. Delete Functions

Update your delete functions to use the API:

```javascript
// Delete post function
async function deletePost(postId) {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/forum-posts/${postId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      console.log('Post deleted successfully');
      // The WebSocket event will handle UI updates automatically
    } else {
      console.error('Failed to delete post');
    }
  } catch (error) {
    console.error('Error deleting post:', error);
  }
}

// Delete comment function
async function deleteComment(commentId) {
  try {
    const response = await fetch(`http://localhost:3000/api/v1/forum-posts/comments/${commentId}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      console.log('Comment deleted successfully');
      // The WebSocket event will handle UI updates automatically
    } else {
      console.error('Failed to delete comment');
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
  }
}
```

## Testing the Integration

1. **Start your frontend application**
2. **Navigate to a thread view**
3. **Open browser developer tools** and check the console for WebSocket connection messages
4. **Delete a post** and verify that:
   - The API call succeeds
   - The WebSocket event is received
   - The UI updates immediately without refresh

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check if backend server is running on port 3000
   - Verify CORS settings in your frontend requests

2. **Events Not Received**
   - Ensure you've joined the correct room
   - Check browser network tab for WebSocket connection
   - Verify event names match between frontend and backend

3. **UI Not Updating**
   - Check if data attributes are correctly set on DOM elements
   - Verify your event handlers are properly connected
   - Check for JavaScript errors in console

### Debugging Tips

```javascript
// Add debug logging to your WebSocket service
this.socket.onAny((eventName, ...args) => {
  console.log(`WebSocket event: ${eventName}`, args);
});
```

This client-side implementation will enable your frontend to receive real-time updates and immediately reflect post and comment deletions across all connected clients.
