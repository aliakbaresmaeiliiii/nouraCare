import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';


@Injectable({
  providedIn: 'root',
})
export class ForumService {
  http = inject(HttpClient);
  private baseUrl = environment.apiEndPoint + 'forum-categories';

  getCategories() {
    return this.http.get(`${this.baseUrl}`);
  }
}
