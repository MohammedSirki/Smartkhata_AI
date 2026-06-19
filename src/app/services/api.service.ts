import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  get<T>(path: string) {
    return this.http.get<T>(this.url(path));
  }

  download(path: string) {
    return this.http.get(this.url(path), { observe: 'response', responseType: 'blob' });
  }

  post<T>(path: string, body: unknown) {
    return this.http.post<T>(this.url(path), body);
  }

  put<T>(path: string, body: unknown) {
    return this.http.put<T>(this.url(path), body);
  }

  delete<T>(path: string) {
    return this.http.delete<T>(this.url(path));
  }

  private url(path: string): string {
    return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }
}
