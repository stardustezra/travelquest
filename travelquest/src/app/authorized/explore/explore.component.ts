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
  userLocation = { latitude: 37.7749, longitude: -122.4194 };
  radiusInKm = 10;
  userHashtags: string[] = [];

  constructor(
    private sessionStore: sessionStoreRepository,
    private geoService: GeoService
  ) {}

  ngOnInit(): void {
    this.initializeUserLocationAndFetchData();
  }

  private initializeUserLocationAndFetchData(): void {
    this.sessionStore.getCurrentUserUID().subscribe((uid) => {
      if (uid) {
        this.saveUserLocationAndFetchData(uid);
      }
    });
  }

  private saveUserLocationAndFetchData(userId: string): void {
    const { latitude, longitude } = this.userLocation;

    this.geoService
      .saveUserLocation(userId, latitude, longitude)
      .then(() => {
        this.fetchUserHashtagsAndLoadUsers(userId);
      })
      .catch((error) => console.error(error));
  }

  private fetchUserHashtagsAndLoadUsers(userId: string): void {
    this.sessionStore.getUserProfile(userId).subscribe((profile) => {
      if (profile && profile.hashtags) {
        this.userHashtags = profile.hashtags;
        this.loadNearbyUsers();
      }
    });
  }

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
                hashtags: this.processHashtags(user.hashtags),
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
   * Process hashtags to ensure correct structure.
   * Adds default category if missing.
   */
  private processHashtags(
    hashtags: any[]
  ): { tag: string; category: string }[] {
    if (!Array.isArray(hashtags)) return [];
    return hashtags.map((h) => ({
      tag: h.tag || '',
      category: h.category || 'custom', // Default to 'custom' if category is missing
    }));
  }
}
