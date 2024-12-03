import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OverpassService {
  private overpassUrl = 'https://overpass-api.de/api/interpreter';

  constructor(private http: HttpClient) {}

  /**
   * Fetch nearby cafés within a given radius.
   * @param latitude - Latitude of the location.
   * @param longitude - Longitude of the location.
   * @param radius - Search radius in meters (default: 1000m).
   * @returns Observable containing the API response.
   */
  fetchNearbyCafes(
    latitude: number,
    longitude: number,
    radius: number = 1000
  ): Observable<any> {
    const query = this.buildOverpassQuery(latitude, longitude, radius, [
      { key: 'amenity', value: 'cafe' },
    ]);
    return this.executeQuery(query);
  }

  /**
   * Fetch nearby restaurants within a given radius.
   * @param latitude - Latitude of the location.
   * @param longitude - Longitude of the location.
   * @param radius - Search radius in meters (default: 1000m).
   * @returns Observable containing the API response.
   */
  fetchNearbyRestaurants(
    latitude: number,
    longitude: number,
    radius: number = 1000
  ): Observable<any> {
    const query = this.buildOverpassQuery(latitude, longitude, radius, [
      { key: 'amenity', value: 'restaurant' },
    ]);
    return this.executeQuery(query);
  }

  /**
   * Fetch nearby cultural places (e.g., art galleries, museums, theatres, cinemas, parks) within a given radius.
   * @param latitude - Latitude of the location.
   * @param longitude - Longitude of the location.
   * @param radius - Search radius in meters (default: 1000m).
   * @returns Observable containing the API response.
   */
  fetchNearbyCulturalPlaces(
    latitude: number,
    longitude: number,
    radius: number = 1000
  ): Observable<any> {
    const query = this.buildOverpassQuery(latitude, longitude, radius, [
      { key: 'tourism', value: 'art_gallery' },
      { key: 'tourism', value: 'museum' },
      { key: 'amenity', value: 'theatre' },
      { key: 'amenity', value: 'cinema' },
      { key: 'leisure', value: 'park' },
    ]);
    return this.executeQuery(query);
  }

  /**
   * Build an Overpass API query string for multiple key-value pairs.
   * @param latitude - Latitude of the location.
   * @param longitude - Longitude of the location.
   * @param radius - Search radius in meters.
   * @param filters - Array of key-value pairs for filtering.
   * @returns The Overpass query string.
   */
  private buildOverpassQuery(
    latitude: number,
    longitude: number,
    radius: number,
    filters: { key: string; value: string }[]
  ): string {
    const filterStrings = filters
      .map(
        (filter) =>
          `node["${filter.key}"="${filter.value}"](around:${radius},${latitude},${longitude});`
      )
      .join('\n');

    return `
      [out:json];
      (
        ${filterStrings}
      );
      out body;
    `;
  }

  /**
   * Execute a query against the Overpass API.
   * @param query - The Overpass API query string.
   * @returns Observable containing the API response.
   */
  private executeQuery(query: string): Observable<any> {
    const options = { responseType: 'json' as const };
    return this.http.post(this.overpassUrl, query, options);
  }
}
