import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ThreadsResponse } from './forum-threads.service';
import { map, catchError } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import {
  EditPostResponse,
  DeletePostResponse,
} from '../interfaces/forum.interface';
export interface ThreadDetailResponse {
  success: boolean;
  data: {
    id: string;
    title: string;
    content: string;
    author: {
      id: number;
      name: string;
      profileImage: string | null;
    };
    forum: {
      id: string;
      title: string;
      description: string;
      categoryId: string;
    };
    isLocked: boolean;
    isPinned: boolean;
    viewCount: number;
    createdAt: string;
    updatedAt: string;
    posts: Array<{
      id: string;
      content: string;
      author: {
        id: number;
        name: string;
        profileImage: string | null;
      };
      authorId: number;
      threadId: string;
      parentId: string | null;
      isDeleted: boolean;
      createdAt: string;
      updatedAt: string;
      replies: any[];
      _count: {
        likes: number;
        replies: number;
      };
    }>;
    _count: {
      posts: number;
    };
  };
}

export interface CreatePostDto {
  content: string;
  threadId: string;
  parentId?: string | null;
  forumId?: string;
}

export interface CreateForumPostDto {
  title: string;
  content: string;
  categoryId: string;
  tags?: string[];
}

export interface CreateForumThreadDto {
  title: string;
  content: string;
  forumId: string;
  authorId: number;
}

export interface PostResponse {
  success: boolean;
  data: {
    id: string;
    content: string;
    author: {
      id: number;
      name: string;
      profileImage: string | null;
    };
    authorId: number;
    threadId: string;
    parentId: string | null;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
    _count: {
      likes: number;
      replies: number;
    };
  };
}

export interface LikeResponse {
  success: boolean;
  data: {
    liked: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  http = inject(HttpClient);
  private baseUrl = environment.apiEndPoint + 'forum-categories';

  storeDataCategory = signal<any[]>([]);

  setStoreDataCategory(data: any[]) {
    this.storeDataCategory.set(data);
  }

  getStoreDataCategory() {
    return this.storeDataCategory;
  }

  getCategories() {
    return this.http.get(`${this.baseUrl}`);
  }

  private forumThreadsBaseUrl = environment.apiEndPoint + 'forum-threads';
  private forumPostsBaseUrl = environment.apiEndPoint + 'forum-posts';

  getAllThreads(page: number = 1, limit: number = 20) {
    return this.http.get<ThreadsResponse>(
      `${this.forumThreadsBaseUrl}?page=${page}&limit=${limit}`
    );
  }



  getThreadsByCategory(
  categoryId: string,
  page: number = 1,
  limit: number = 20
) {
  return this.http.get<ThreadsResponse>(
    `${this.forumThreadsBaseUrl}/category/${categoryId}?page=${page}&limit=${limit}`
  );
}


  getThreadById(threadId: string | null) {
    return this.http.get<ThreadDetailResponse>(
      `${this.forumThreadsBaseUrl}/${threadId}`
    );
  }

  createPost(postData: CreatePostDto) {
    return this.http.post<PostResponse>(this.forumPostsBaseUrl, postData);
  }

  createForumPost(postData: CreateForumPostDto) {
    return this.http.post<any>(this.forumPostsBaseUrl, postData);
  }

  createForumThread(threadData: CreateForumThreadDto) {
    return this.http.post<any>(this.forumThreadsBaseUrl, threadData);
  }

  likePost(postId: string) {
    return this.http.post<LikeResponse>(
      `${this.forumPostsBaseUrl}/${postId}/like`,
      {}
    );
  }

  replyToComment(payload: CreatePostDto) {
    const replyData: CreatePostDto = {
      content: payload.content,
      threadId: payload.threadId,
      parentId: payload.parentId,
      forumId: payload.forumId,
    };

    return this.http.post<PostResponse>(this.forumPostsBaseUrl, replyData);
  }

  updatePost(postId: string, content: string) {
    return this.http.put<PostResponse>(
      `${this.forumPostsBaseUrl}/comments/${postId}`,
      {
        content: content,
      }
    );
  }

  // Alternative method using the specific comments endpoint
  editComment(commentId: string, content: string) {
    return this.http.put<PostResponse>(
      `${this.forumPostsBaseUrl}/comments/${commentId}`,
      {
        content: content,
      }
    );
  }

  deletePost(postId: string) {
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.forumPostsBaseUrl}/comments/${postId}`
    );
  }

  // Alternative method using the specific comments endpoint
  deleteComment(commentId: string) {
    return this.http
      .delete(`${this.forumThreadsBaseUrl}/${commentId}`, {
        observe: 'response',
      })
      .pipe(
        map((response) => {
          // Handle 204 No Content response
          if (response.status === 204) {
            return { success: true, message: 'Comment deleted successfully' };
          }
          // For other status codes, try to parse the response body
          return (
            response.body || {
              success: true,
              message: 'Comment deleted successfully',
            }
          );
        }),
        catchError((error) => {
          // Handle error responses
          if (error.status === 204) {
            return of({
              success: true,
              message: 'Comment deleted successfully',
            });
          }
          return throwError(() => error);
        })
      );
  }

  // Post (Thread) edit and delete methods
  editPost(postId: string | null, title: string, content: string) {
    // Try PATCH first, as PUT might not be supported
    return this.http.patch<EditPostResponse>(
      `${this.forumThreadsBaseUrl}/${postId}`,
      {
        title: title,
        content: content,
      }
    );
  }

  deletePostById(postId: string | null) {
    return this.http
      .delete(`${this.forumThreadsBaseUrl}/${postId}`, { observe: 'response' })
      .pipe(
        map((response) => {
          // Handle 204 No Content response (standard for DELETE operations)
          if (response.status === 204) {
            return { success: true, message: 'Post deleted successfully' };
          }
          // For other status codes, try to parse the response body
          return (
            response.body || {
              success: true,
              message: 'Post deleted successfully',
            }
          );
        }),
        catchError((error) => {
          // Handle error responses
          if (error.status === 204) {
            return of({ success: true, message: 'Post deleted successfully' });
          }
          return throwError(() => error);
        })
      );
  }
}
