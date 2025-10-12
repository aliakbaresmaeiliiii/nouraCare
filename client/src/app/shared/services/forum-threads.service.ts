import { Injectable } from '@angular/core';

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

}
