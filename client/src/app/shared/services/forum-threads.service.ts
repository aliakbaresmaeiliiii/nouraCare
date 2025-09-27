import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

export interface ThreadsResponse {
  success: boolean;
  data: {
    threads: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

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
export class ForumThreadsService {
  http = inject(HttpClient);
  private baseUrl = environment.apiEndPoint + 'forum-threads';
  private postsBaseUrl = environment.apiEndPoint + 'forum-posts';

  getAllThreads(page: number = 1, limit: number = 20) {
    return this.http.get<ThreadsResponse>(
      `${this.baseUrl}?page=${page}&limit=${limit}`
    );
  }

  getThreadsByCategory(
    categoryId: string,
    page: number = 1,
    limit: number = 20
  ) {
    return this.http.get<ThreadsResponse>(
      `${this.baseUrl}?category=${categoryId}&page=${page}&limit=${limit}`
    );
  }

  getThreadById(threadId: string) {
    return this.http.get<ThreadDetailResponse>(`${this.baseUrl}/${threadId}`);
  }

  createPost(postData: CreatePostDto) {
    return this.http.post<PostResponse>(this.postsBaseUrl, postData);
  }

  likePost(postId: string) {
    return this.http.post<LikeResponse>(
      `${this.postsBaseUrl}/${postId}/like`,
      {}
    );
  }



  replyToComment(parentId: string, content: string, threadId: string) {
    const replyData: CreatePostDto = {
      content: content,
      threadId: threadId,
      parentId: parentId
    };
    return this.http.post<PostResponse>(this.postsBaseUrl, replyData);
  }

  updatePost(postId: string, content: string) {
    return this.http.put<PostResponse>(`${this.postsBaseUrl}/comments/${postId}`, {
      content: content
    });
  }

  // Alternative method using the specific comments endpoint
  editComment(commentId: string, content: string) {
    return this.http.put<PostResponse>(`${this.postsBaseUrl}/comments/${commentId}`, {
      content: content
    });
  }

  deletePost(postId: string) {
    return this.http.delete<{success: boolean; message?: string}>(`${this.postsBaseUrl}/${postId}`);
  }
}
