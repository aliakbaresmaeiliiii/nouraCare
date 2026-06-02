import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
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
  UserForumActivityResponse,
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
  storeDataThread = signal<any[]>([]);


  setStoreDataCategory(data: any[]) {
    this.storeDataCategory.set(data);
  }

  getStoreDataCategory() {
    return this.storeDataCategory();
  }

  setStoreDataThread(data: any[]) {
    this.storeDataThread.set(data);
  }

  getStoreDataThread() {
    return this.storeDataThread();
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

  getUserForumActivity(page: number = 1, limit: number = 20) {
    return this.http.get<UserForumActivityResponse>(
      `${this.forumThreadsBaseUrl}/me/activity?page=${page}&limit=${limit}`,
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

  fetchThreadById(threadId: string | null, viewerId?: number | null) {
    const viewerQuery =
      typeof viewerId === 'number' && Number.isFinite(viewerId)
        ? `?viewerId=${viewerId}`
        : '';
    return this.http.get<ThreadDetailResponse>(
      `${this.forumThreadsBaseUrl}/${threadId}${viewerQuery}`,
    );
  }

  createComment(createComment: CreateCommentDto) {
    const payload: any = {
      comment: (createComment as any).comment || (createComment as any).content,
      postId: (createComment as any).postId || (createComment as any).id,
      parentId: createComment.parentId,
    };
    return this.http.post<PostResponse>(
      `${this.forumCommentBaseUrl}`,
      payload,
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

  editComment(commentId: string, content: string) {
    return this.http.patch<PostResponse>(`${this.forumCommentBaseUrl}/${commentId}`, {
      comment: content,
    });
  }

  deletePost(postId: string) {
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.forumPostsBaseUrl}/comments/${postId}`,
    );
  }

  deleteComment(commentId: string) {
    return this.http.delete<{
      success: boolean;
      data?: unknown;
      message?: string;
    }>(`${this.forumCommentBaseUrl}/${commentId}`);
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
