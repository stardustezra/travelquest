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
  nearbyUsers$: Observable<any[]> = of([]); // Observable to hold nearby users
  userLocation = { latitude: 37.7749, longitude: -122.4194 }; // Default user location (replace with dynamic data)
  radiusInKm = 10; // Radius in kilometers
  userHashtags: string[] = []; // Dynamically fetched user's hashtags

  constructor(
    private sessionStore: sessionStoreRepository,
    private geoService: GeoService
  ) {}

  ngOnInit(): void {
    console.log('Component initialized');
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
        console.warn('No user logged in.');
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
        console.log('User location saved successfully.');
        this.fetchUserHashtagsAndLoadUsers(userId);
      })
      .catch((error) => {
        console.error('Failed to save user location:', error);
      });
  }

  /**
   * Fetch user hashtags and load nearby users based on the hashtags.
   */
  private fetchUserHashtagsAndLoadUsers(userId: string): void {
    console.log('Fetching user hashtags...');
    this.sessionStore.getUserProfile(userId).subscribe((profile) => {
      if (profile && profile.hashtags) {
        this.userHashtags = profile.hashtags; // Dynamically assign hashtags
        console.log('User hashtags:', this.userHashtags);
        this.loadNearbyUsers(); // Load nearby users after fetching hashtags
      } else {
        console.warn('No hashtags found for the user.');
      }
    });
  }

  /**
   * Load nearby users based on user location and hashtags.
   */
  private loadNearbyUsers(): void {
    console.log('Loading nearby users...');
    console.log('User Location:', this.userLocation);
    console.log('Radius in Km:', this.radiusInKm);

    this.nearbyUsers$ = new Observable((observer) => {
      this.geoService
        .findNearbyUsers(
          this.userLocation.latitude,
          this.userLocation.longitude,
          this.radiusInKm,
          this.userHashtags
        )
        .then((users) => {
          // Process users to include age and transform hashtags
          const processedUsers = users.map((user) => ({
            ...user,
            age: this.calculateAge(user.dob), // Calculate age
            hashtags: this.extractHashtagTags(user.hashtags), // Extract hashtag tags
          }));

          console.log('Processed users:', processedUsers); // Log processed users
          observer.next(processedUsers);
          observer.complete();
        })
        .catch((error) => {
          console.error('Error loading nearby users:', error);
          observer.next([]);
          observer.complete();
        });
    });
  }

  /**
   * Calculate age from Firestore timestamp.
   */
  private calculateAge(
    dob: { seconds: number; nanoseconds: number } | null
  ): number {
    if (!dob) return 0; // Default to 0 if dob is missing
    const birthDate = new Date(dob.seconds * 1000); // Convert Firestore timestamp
    const ageDifMs = Date.now() - birthDate.getTime();
    const ageDate = new Date(ageDifMs); // Convert to Date object
    return Math.abs(ageDate.getUTCFullYear() - 1970); // Calculate age
  }

  /**
   * Extract tags from hashtags array.
   */
  private extractHashtagTags(hashtags: any[]): string[] {
    if (!Array.isArray(hashtags)) return [];
    return hashtags
      .map((h) => (h && h.tag ? h.tag : null)) // Extract 'tag' if it exists
      .filter((tag) => tag !== null); // Remove null values
  }
}
