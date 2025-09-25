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

@Injectable({
  providedIn: 'root',
})
export class ForumThreadsService {
  http = inject(HttpClient);
  private baseUrl = environment.apiEndPoint + 'forum-threads';

  getAllThreads(page: number = 1, limit: number = 20) {
    return this.http.get<ThreadsResponse>(`${this.baseUrl}?page=${page}&limit=${limit}`);
  }

  getThreadsByCategory(categoryId: string, page: number = 1, limit: number = 20) {
    return this.http.get<ThreadsResponse>(`${this.baseUrl}?category=${categoryId}&page=${page}&limit=${limit}`);
  }

  getThreadById(threadId: string) {
    return this.http.get(`${this.baseUrl}/${threadId}`);
  }
}
