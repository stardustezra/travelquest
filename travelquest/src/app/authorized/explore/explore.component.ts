import { Component, OnInit } from '@angular/core';
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';
import { GeoService } from '../../shared/data-services/geolocation.service';
import { Observable, of } from 'rxjs';
import { SnackbarService } from '../../shared/snackbar/snackbar.service';

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
    private geoService: GeoService,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    console.log('Component initialized');
    this.initializeUserLocationAndFetchData();
  }

  /**
   * Initialize user location and fetch related data.
   */
  private initializeUserLocationAndFetchData(): void {
    this.sessionStore.getCurrentUserUID().subscribe({
      next: (uid) => {
        if (uid) {
          this.saveUserLocationAndFetchData(uid);
        } else {
          console.warn('No user logged in.');
          this.snackbarService.error('User is not logged in.');
        }
      },
      error: (err) => {
        console.error('Error fetching current user UID:', err);
        this.snackbarService.error('Error fetching user UID.');
      },
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
        console.log('User location saved successfully.');
        this.fetchUserHashtagsAndLoadUsers(userId);
      })
      .catch((error) => {
        console.error('Failed to save user location:', error);
        this.snackbarService.error('Failed to save your location.');
      });
  }

  /**
   * Fetch user hashtags and load nearby users based on the hashtags.
   */
  private fetchUserHashtagsAndLoadUsers(userId: string): void {
    console.log('Fetching user hashtags...');
    this.sessionStore.getUserProfile(userId).subscribe({
      next: (profile) => {
        if (profile && profile.hashtags) {
          this.userHashtags = profile.hashtags;
          console.log('User hashtags:', this.userHashtags);
          this.loadNearbyUsers();
        } else {
          console.warn('No hashtags found for the user.');
          this.snackbarService.error('No hashtags found for the user.');
        }
      },
      error: (err) => {
        console.error('Error fetching user profile:', err);
        this.snackbarService.error('Error fetching user profile.');
      },
    });
  }

  /**
   * Load nearby users based on user location and hashtags.
   */
  private loadNearbyUsers(): void {
    console.log('Loading nearby users...');
    console.log('User Location:', this.userLocation);
    console.log('Radius in Km:', this.radiusInKm);

    this.sessionStore.getCurrentUserUID().subscribe({
      next: (currentUserId) => {
        if (!currentUserId) {
          console.warn('No user is logged in.');
          this.snackbarService.error('No user is logged in.');
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
                .filter((user) => user.uid !== currentUserId) // Exclude current user
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
              console.error('Error loading nearby users:', error);
              this.snackbarService.error('Error loading nearby users.');
              observer.next([]);
              observer.complete();
            });
        });
      },
      error: (err) => {
        console.error('Error fetching current user UID for nearby users:', err);
        this.snackbarService.error('Error fetching current user UID.');
      },
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
