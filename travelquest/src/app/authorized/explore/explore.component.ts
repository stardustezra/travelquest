import { Component, OnInit } from '@angular/core';
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';
import { GeoService } from '../../shared/data-services/geolocation.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'travelquest-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
})
export class ExploreComponent implements OnInit {
  nearbyUsers$: Observable<any[]> = of([]);
  userLocation = { latitude: 37.7749, longitude: -122.4194 }; // Default user location (replace with dynamic data)
  radiusInKm = 10;
  userHashtags: string[] = [];

  constructor(
    private sessionStore: sessionStoreRepository,
    private geoService: GeoService
  ) {}

  ngOnInit(): void {
    this.initializeUserLocationAndFetchData();
  }

  /**
   * Initialize user location and fetch related data.
   */
  private initializeUserLocationAndFetchData(): void {
    this.sessionStore.getCurrentUserUID().subscribe((uid) => {
      if (uid) {
        this.saveUserLocationAndFetchData(uid);
      } else {
      }
    });
  }

  /**
   * Save user location and fetch hashtags and nearby users.
   */
  private saveUserLocationAndFetchData(userId: string): void {
    const { latitude, longitude } = this.userLocation;

    this.geoService
      .saveUserLocation(userId, latitude, longitude)
      .then(() => {
        this.fetchUserHashtagsAndLoadUsers(userId);
      })
      .catch((error) => {});
  }

  /**
   * Fetch user hashtags and load nearby users based on the hashtags.
   */
  private fetchUserHashtagsAndLoadUsers(userId: string): void {
    this.sessionStore.getUserProfile(userId).subscribe((profile) => {
      if (profile && profile.hashtags) {
        this.userHashtags = profile.hashtags;

        this.loadNearbyUsers();
      } else {
      }
    });
  }

  /**
   * Load nearby users based on user location and hashtags.
   */
  private loadNearbyUsers(): void {
    this.sessionStore.getCurrentUserUID().subscribe((currentUserId) => {
      if (!currentUserId) {
        return;
      }

      this.nearbyUsers$ = new Observable((observer) => {
        this.geoService
          .findNearbyUsers(
            this.userLocation.latitude,
            this.userLocation.longitude,
            this.radiusInKm,
            this.userHashtags
          )
          .then((users) => {
            const processedUsers = users
              .filter((user) => user.uid !== currentUserId)
              .map((user) => ({
                ...user,
                age: this.calculateAge(user.dob),
                hashtags: this.extractHashtagTags(user.hashtags),
              }));

            console.log('Processed users:', processedUsers);
            observer.next(processedUsers);
            observer.complete();
          })
          .catch((error) => {
            observer.next([]);
            observer.complete();
          });
      });
    });
  }

  /**
   * Calculate age from Firestore timestamp.
   */
  private calculateAge(
    dob: { seconds: number; nanoseconds: number } | null
  ): number {
    if (!dob) return 0;
    const birthDate = new Date(dob.seconds * 1000);
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  /**
   * Extract tags from hashtags array.
   */
  private extractHashtagTags(hashtags: any[]): string[] {
    if (!Array.isArray(hashtags)) return [];
    return hashtags
      .map((h) => (h && h.tag ? h.tag : null))
      .filter((tag) => tag !== null);
  }
}
