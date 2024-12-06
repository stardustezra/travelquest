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
   * Get the current user's location as an observable (one-time fetch).
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
          this.handleGeolocationError(error, observer);
        }
      );
    });
  }

  /**
   * Watch the user's location for changes (live updates).
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
          this.handleGeolocationError(error, observer);
        }
      );

      // Cleanup when subscription is unsubscribed
      return () => {
        navigator.geolocation.clearWatch(watchId);
      };
    });
  }

  /**
   * Handle geolocation errors and notify the observer.
   * @param error Geolocation error object
   * @param observer Observer to notify
   */
  private handleGeolocationError(
    error: GeolocationPositionError,
    observer: any
  ): void {
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
}
