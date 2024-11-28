import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UnsplashService {
  private apiKey = 'LEcp69dI7D886LcoY42VKUR0wMXUwnOann0rZhSDFH8';
  private apiUrl = 'https://api.unsplash.com/search/photos';

  constructor(private http: HttpClient) {}

  searchImages(query: string, perPage: number = 10): Observable<any> {
    const url = `${this.apiUrl}?query=${query}&per_page=${perPage}&client_id=${this.apiKey}`;
    return this.http.get(url);
  }
}
