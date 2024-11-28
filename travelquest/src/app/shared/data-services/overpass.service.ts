import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OverpassService {
  private overpassUrl = 'https://overpass-api.de/api/interpreter';

  constructor(private http: HttpClient) {}

  fetchNearbyCafes(
    latitude: number,
    longitude: number,
    radius: number = 1000
  ): Observable<any> {
    const query = `
      [out:json];
      node["amenity"="cafe"](around:${radius},${latitude},${longitude});
      out body;
    `;
    const options = { responseType: 'json' as const };
    return this.http.post(this.overpassUrl, query, options);
  }
}
