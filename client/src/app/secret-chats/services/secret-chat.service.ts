import { HttpClient, HttpEventType } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { 
  SecretChat, 
  PostCategory, 
  CreateSecretChatDto,
  CreatePostDto,
  CreateMessageDto,
  CreateCommentDto,
  Post,
  ChatMessage,
  Comment,
  ApiResponse,
  PaginatedResponse 
} from '../secret.chats.dto';
import { Observable, forkJoin, throwError } from 'rxjs';
import { map, catchError, filter } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SecretChatsService {
  http = inject(HttpClient);
  private baseUrl = environment.apiEndPoint + 'secret-chats';

  // ===== CATEGORY ENDPOINTS =====
  
  /**
   * Get all post categories
   */
  getCategories(): Observable<PostCategory[]> {
    return this.http.get<PostCategory[]>(`${this.baseUrl}/categories`);
  }

  // ===== CHAT ENDPOINTS =====
  
  /**
   * Get all chats for current user
   */
  getUserChats(): Observable<SecretChat[]> {
    return this.http.get<SecretChat[]>(`${this.baseUrl}`);
  }

  /**
   * Get specific chat by ID
   */
  getChat(chatId: string): Observable<SecretChat> {
    return this.http.get<SecretChat>(`${this.baseUrl}/${chatId}`);
  }

  /**
   * Create new chat
   */
  createChat(chatData: CreateSecretChatDto): Observable<SecretChat> {
    return this.http.post<SecretChat>(`${this.baseUrl}`, chatData);
  }

  // ===== POST ENDPOINTS =====
  
  /**
   * Get posts for a specific chat
   */
  getChatPosts(chatId: string, page: number = 1, limit: number = 20): Observable<PaginatedResponse<Post>> {
    return this.http.get<PaginatedResponse<Post>>(`${this.baseUrl}/${chatId}/posts?page=${page}&limit=${limit}`);
  }


  /**
   * Upload media file with progress tracking
   */
  uploadMedia(file: File): Observable<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post<{ url: string }>(`${this.baseUrl}/posts/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      filter(event => event.type === HttpEventType.Response),
      map(event => (event as any).body as { url: string }),
      catchError(error => {
        console.error('Media upload failed:', error);
        return throwError(() => new Error(`Upload failed: ${error.message || error}`));
      })
    );
  }

  /**
   * Upload multiple media files
   */
  uploadMultipleMedia(files: File[]): Observable<{ url: string }[]> {
    const uploads = files.map(file => this.uploadMedia(file));
    return forkJoin(uploads);
  }

  /**
   * Legacy method - use uploadMedia instead
   * @deprecated
   */
  uploadFile(file: File): Observable<{ url: string }> {
    return this.uploadMedia(file);
  }

  /**
   * Create new post in chat
   */
  createPost(postData: CreatePostDto): Observable<Post> {
    return this.http.post<Post>(`${this.baseUrl}/posts`, postData).pipe(
      map(response => {
        return response;  
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Like/Unlike a post
   */
  togglePostLike(postId: string): Observable<{ liked: boolean }> {
    return this.http.post<{ liked: boolean }>(`${this.baseUrl}/posts/${postId}/like`, {});
  }

  // ===== COMMENT ENDPOINTS =====
  
  /**
   * Get comments for a specific post
   */
  getPostComments(postId: string, page: number = 1, limit: number = 50): Observable<PaginatedResponse<Comment>> {
    return this.http.get<PaginatedResponse<Comment>>(`${this.baseUrl}/posts/${postId}/comments?page=${page}&limit=${limit}`);
  }

  /**
   * Create a new comment on a post
   */
  createComment(commentData: CreateCommentDto): Observable<Comment> {
    return this.http.post<Comment>(`${this.baseUrl}/comments`, commentData).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  /**
   * Like/Unlike a comment
   */
  toggleCommentLike(commentId: string): Observable<{ liked: boolean }> {
    return this.http.post<{ liked: boolean }>(`${this.baseUrl}/comments/${commentId}/like`, {});
  }

  /**
   * Delete a comment
   */
  deleteComment(commentId: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/comments/${commentId}`);
  }

  // ===== MESSAGE ENDPOINTS =====
  
  /**
   * Get messages for a specific chat
   */
  getChatMessages(chatId: string, page: number = 1, limit: number = 50): Observable<PaginatedResponse<ChatMessage>> {
    return this.http.get<PaginatedResponse<ChatMessage>>(`${this.baseUrl}/${chatId}/messages?page=${page}&limit=${limit}`);
  }

  /**
   * Send message to chat
   */
  sendMessage(messageData: CreateMessageDto): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.baseUrl}/messages`, messageData);
  }

  // ===== MEMBER ENDPOINTS =====
  
  /**
   * Add member to chat
   */
  addMember(chatId: string, userId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/${chatId}/members`, { userId });
  }

  /**
   * Remove member from chat
   */
  removeMember(chatId: string, userId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${chatId}/members/${userId}`);
  }

  // ===== UTILITY METHODS =====
  

  /**
   * Search posts by content or category
   */
  searchPosts(query: string, categoryId?: string): Observable<Post[]> {
    let url = `${this.baseUrl}/posts/search?q=${encodeURIComponent(query)}`;
    if (categoryId) {
      url += `&categoryId=${categoryId}`;
    }
    return this.http.get<Post[]>(url);
  }
}
