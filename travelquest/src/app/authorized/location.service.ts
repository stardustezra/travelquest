import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private apiUrl = 'https://nominatim.openstreetmap.org/search'; // Nominatim API endpoint

  constructor(private http: HttpClient) {}

  /**
   * Fetch locations based on search query and proximity
   * @param query - Search query
   * @param latitude - User's latitude
   * @param longitude - User's longitude
   * @param radius - Radius in meters (default: 1000)
   * @returns Observable of search results
   */
  searchLocations(
    query: string,
    latitude: number,
    longitude: number,
    radius: number = 1000 // Default radius is 1km
  ): Observable<any[]> {
    // Earth's radius in meters
    const R = 6371e3;

    // Convert the radius to degrees latitude and longitude
    const latDelta = (radius / R) * (180 / Math.PI);
    const lonDelta =
      (radius / (R * Math.cos((latitude * Math.PI) / 180))) * (180 / Math.PI);

    // Calculate the bounding box for the search
    const minLat = latitude - latDelta;
    const maxLat = latitude + latDelta;
    const minLon = longitude - lonDelta;
    const maxLon = longitude + lonDelta;

    // Construct the API query URL with bounding box and proximity
    const url = `${this.apiUrl}?q=${query}&format=json&addressdetails=1&bounded=1&viewbox=${minLon},${maxLat},${maxLon},${minLat}`;

    // Perform the HTTP GET requestt
    return this.http.get<any[]>(url);
  }
}
