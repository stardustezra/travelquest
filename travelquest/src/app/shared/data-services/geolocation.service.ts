import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root',
})
export class GeolocationService {
  constructor() {}

  /**
   * Get the current user's location as an observable.
   * @returns Observable<UserLocation>
   */
  getCurrentUserLocation(): Observable<UserLocation> {
    return new Observable((observer) => {
      if (!navigator.geolocation) {
        observer.error('Geolocation is not supported by this browser.');
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          observer.next({ latitude, longitude });
          observer.complete();
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              observer.error('User denied the request for Geolocation.');
              break;
            case error.POSITION_UNAVAILABLE:
              observer.error('Location information is unavailable.');
              break;
            case error.TIMEOUT:
              observer.error('The request to get user location timed out.');
              break;
            default:
              observer.error('An unknown error occurred.');
              break;
          }
        }
      );
    });
  }

  /**
   * Watch the user's location for changes.
   * @returns Observable<UserLocation>
   */
  watchUserLocation(): Observable<UserLocation> {
    return new Observable((observer) => {
      if (!navigator.geolocation) {
        observer.error('Geolocation is not supported by this browser.');
        return;
      }

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          observer.next({ latitude, longitude });
        },
        (error) => {
          observer.error('Error watching user location: ' + error.message);
        }
      );

      // Cleanup when subscription is unsubscribed
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    });
  }
}
