import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { map, catchError } from 'rxjs/operators';
import { of, throwError } from 'rxjs';
import {
  EditPostResponse,
  DeletePostResponse,
} from '../interfaces/forum.interface';

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
