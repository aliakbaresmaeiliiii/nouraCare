import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EditPostResponse } from '../interfaces/forum.interface';
import { ThreadsResponse } from './forum-threads.service';
import {
  CreateForumPostDto,
  CreateForumThreadDto,
  CreateCommentDto,
  ForumTopic,
  LikeResponse,
  PostResponse,
  ThreadDetailResponse,
} from '../models/forum';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ForumService {
  http = inject(HttpClient);
  private baseUrl = environment.apiEndPoint + 'forum-categories';

  // Event emitter for post deletion
  private postDeletedSubject = new Subject<string>();
  postDeleted$ = this.postDeletedSubject.asObservable();
  topicDetail = signal<ForumTopic | null>(null);

  setTopicDetail(data: ForumTopic) {
    this.topicDetail.set(data);
  }

  getTopicDetail() {
    return this.topicDetail();
  }

  postCreated = signal<boolean>(false);

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
  private forumBaseUrl = environment.apiEndPoint + 'forum';
  private forumCommentBaseUrl = environment.apiEndPoint + 'forum-comments';

  getAllThreads(page: number = 1, limit: number = 20) {
    return this.http.get<ThreadsResponse>(
      `${this.forumThreadsBaseUrl}?page=${page}&limit=${limit}`,
    );
  }

  getThreadsByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    return this.http.get<ThreadsResponse>(
      `${this.forumThreadsBaseUrl}/category/${categoryId}?page=${page}&limit=${limit}`,
    );
  }

  fetchTopicDetail(threadId: string | null) {
    return this.http.get<ThreadDetailResponse>(
      `${this.forumThreadsBaseUrl}/${threadId}`,
    );
  }

  fetchThreadById(threadId: string | null) {
    return this.http.get<ThreadDetailResponse>(
      `${this.forumThreadsBaseUrl}/${threadId}`,
    );
  }

  createComment(createComment: CreateCommentDto) {
    return this.http.post<PostResponse>(
      `${this.forumCommentBaseUrl}`,
      createComment,
    );
  }

  createForumPost(postData: CreateForumPostDto) {
    return this.http.post<any>(this.forumThreadsBaseUrl, postData);
  }

  createForumThread(threadData: CreateForumThreadDto) {
    return this.http.post<any>(this.forumThreadsBaseUrl, threadData);
  }

  likeComment(commentId: string, isLike: boolean) {
    return this.http.post<LikeResponse>(
      `${this.forumBaseUrl}/comment/${commentId}/like`,
      { isLike },
    );
  }

  replyToComment(payload: CreateCommentDto) {
    const replyData: CreateCommentDto = {
      content: payload.content,
      postId: payload.postId!,
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
      },
    );
  }

  // Alternative method using the specific comments endpoint
  editComment(commentId: string, content: string) {
    return this.http.put<PostResponse>(
      `${this.forumPostsBaseUrl}/comments/${commentId}`,
      {
        content: content,
      },
    );
  }

  deletePost(postId: string) {
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.forumPostsBaseUrl}/comments/${postId}`,
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
        }),
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
        // Backward compatibility with APIs still expecting `description`
        description: content,
      },
    );
  }

  deletePostById(postId: string | null) {
    return this.http.delete(`${this.forumThreadsBaseUrl}/${postId}`, {
      observe: 'response',
    });
  }

  // Method to emit post deletion event
  emitPostDeleted(postId: string | null) {
    if (postId) {
      this.postDeletedSubject.next(postId);
    }
  }

  emitPostCreated() {
    this.postDeletedSubject.next('created');
  }
}
