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
    this.fetchUserHashtagsAndLoadUsers();
  }

  fetchUserHashtagsAndLoadUsers(): void {
    console.log('Fetching user hashtags...');
    this.sessionStore.getCurrentUserUID().subscribe((uid) => {
      if (!uid) {
        console.warn('No user logged in. Cannot fetch hashtags.');
        return;
      }

      this.sessionStore.getUserProfile(uid).subscribe((profile) => {
        if (profile && profile.hashtags) {
          this.userHashtags = profile.hashtags; // Dynamically assign hashtags
          console.log('User hashtags:', this.userHashtags);
          this.loadNearbyUsers(); // Load nearby users after fetching hashtags
        } else {
          console.warn('No hashtags found for the user.');
        }
      });
    });
  }

  loadNearbyUsers(): void {
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
          console.log('Users found:', users); // Log the users returned
          observer.next(users);
          observer.complete();
        })
        .catch((error) => {
          console.error('Error loading nearby users:', error);
          observer.next([]);
          observer.complete();
        });
    });
  }
}
