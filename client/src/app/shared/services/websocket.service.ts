import { Injectable, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket;
  private isConnected = false;

  constructor() {
    console.log('🔌 WebSocketService: Initializing WebSocket connection...');
    
    // Extract base URL from API endpoint (remove /api/v1/)
    const baseUrl = environment.apiEndPoint.replace('/api/v1/', '');
    console.log('🔌 WebSocketService: Connecting to:', baseUrl);
    
    this.socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    this.setupEventListeners();
    console.log('🔌 WebSocketService: Event listeners setup complete');
  }

  private setupEventListeners(): void {
    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('✅ WebSocketService: Connected to WebSocket server');
      console.log('🔌 WebSocketService: Socket ID:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      console.log('❌ WebSocketService: Disconnected from WebSocket server. Reason:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ WebSocketService: Connection error:', error);
    });

    this.socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 WebSocketService: Reconnection attempt ${attempt}`);
    });

    this.socket.on('reconnect', (attempt) => {
      console.log(`✅ WebSocketService: Reconnected after ${attempt} attempts`);
    });

    this.socket.on('postDeleted', (data: { postId: string }) => {
      console.log('📨 WebSocketService: Received postDeleted event:', data);
      this.handlePostDeleted(data.postId);
    });

    this.socket.on('commentDeleted', (data: { commentId: string }) => {
      console.log('📨 WebSocketService: Received commentDeleted event:', data);
      this.handleCommentDeleted(data.commentId);
    });

    this.socket.on('postCreated', (data: any) => {
      console.log('📨 WebSocketService: Received postCreated event:', data);
      this.handlePostCreated(data);
    });

    this.socket.on('commentCreated', (data: any) => {
      console.log('📨 WebSocketService: Received commentCreated event:', data);
      this.handleCommentCreated(data);
    });

    // Debug: log all events
    this.socket.onAny((eventName, ...args) => {
      console.log(`📨 WebSocketService: Event received - ${eventName}`, args);
    });

    // Test connection by emitting a test event
    this.socket.emit('testConnection', { message: 'WebSocket client connected' });
  }

  // Join thread room when viewing a thread
  joinThread(threadId: string): void {
    if (this.isConnected) {
      this.socket.emit('joinThread', threadId);
      console.log(`🔌 WebSocketService: Joined thread room: ${threadId}`);
    } else {
      console.warn('⚠️ WebSocketService: WebSocket not connected, cannot join thread room');
      console.log('⚠️ WebSocketService: Current connection status:', this.isConnected);
    }
  }

  // Leave thread room when navigating away
  leaveThread(threadId: string): void {
    if (this.isConnected) {
      this.socket.emit('leaveThread', threadId);
      console.log(`🔌 WebSocketService: Left thread room: ${threadId}`);
    } else {
      console.warn('⚠️ WebSocketService: WebSocket not connected, cannot leave thread room');
    }
  }

  // Join post room when viewing a specific post
  joinPost(postId: string): void {
    if (this.isConnected) {
      this.socket.emit('joinPost', postId);
      console.log(`Joined post room: ${postId}`);
    } else {
      console.warn('WebSocket not connected, cannot join post room');
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
    
    // Update UI for deleted post
    const postElement = document.querySelector(`[data-post-id="${postId}"]`);
    if (postElement) {
      postElement.classList.add('deleted');
      const deletedMessage = document.createElement('div');
      deletedMessage.className = 'deleted-message';
      deletedMessage.textContent = 'This post has been deleted';
      postElement.appendChild(deletedMessage);
    }

    // Dispatch custom event for components to listen to
    const event = new CustomEvent('postDeleted', { detail: { postId } });
    window.dispatchEvent(event);
  }

  private handleCommentDeleted(commentId: string): void {
    console.log(`Comment deleted: ${commentId}`);
    
    // Update UI for deleted comment
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (commentElement) {
      commentElement.classList.add('deleted');
      const deletedMessage = document.createElement('div');
      deletedMessage.className = 'deleted-message';
      deletedMessage.textContent = 'This comment has been deleted';
      commentElement.appendChild(deletedMessage);
    }

    // Dispatch custom event for components to listen to
    const event = new CustomEvent('commentDeleted', { detail: { commentId } });
    window.dispatchEvent(event);
  }

  private handlePostCreated(postData: any): void {
    console.log('📨 WebSocketService: Handling post creation:', postData);
    
    // Dispatch custom event for components to listen to
    const event = new CustomEvent('postCreated', { detail: { postData } });
    window.dispatchEvent(event);
  }

  private handleCommentCreated(commentData: any): void {
    console.log('📨 WebSocketService: Handling comment creation:', commentData);
    
    // Dispatch custom event for components to listen to
    const event = new CustomEvent('commentCreated', { detail: { commentData } });
    window.dispatchEvent(event);
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Disconnect from server
  disconnect(): void {
    this.socket.disconnect();
  }
}
