import { Component, OnInit } from '@angular/core';
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';
import { OverpassService } from '../../shared/data-services/overpass.service';
import { UnsplashService } from '../../shared/data-services/unsplash.service';

@Component({
  selector: 'travelquest-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  userName: string = '';
  userLocation: { latitude: number; longitude: number } | null = null;
  nearbyCafes: any[] = [];
  cafeImages: { [key: string]: string } = {}; // To store café images by café name
  usedImageUrls: Set<string> = new Set(); // Track used image URLs to avoid duplicates

  constructor(
    private sessionStore: sessionStoreRepository,
    private overpassService: OverpassService,
    private unsplashService: UnsplashService
  ) {}

  ngOnInit(): void {
    // Fetch user's name
    this.sessionStore.getCurrentUserUID().subscribe((uid) => {
      if (uid) {
        this.sessionStore.getUserProfile(uid).subscribe((profile) => {
          this.userName = profile?.name || 'User';
        });
      }
    });

    // Fetch user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          this.userLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          console.log('User Location:', this.userLocation);

          // Fetch nearby cafés
          if (this.userLocation) {
            this.fetchNearbyCafes();
          }
        },
        (error: GeolocationPositionError) => {
          console.error('Geolocation error:', error.message);
        }
      );
    }
  }

  fetchNearbyCafes(): void {
    if (this.userLocation) {
      const { latitude, longitude } = this.userLocation;

      this.overpassService.fetchNearbyCafes(latitude, longitude).subscribe({
        next: (data) => {
          this.nearbyCafes = data.elements || [];
          this.fetchCafeImages(); // Fetch images for the cafés
        },
        error: (err) => console.error('Error fetching nearby cafés:', err),
      });
    }
  }

  fetchCafeImages(): void {
    const cafeNames = this.nearbyCafes
      .map((cafe) => cafe.tags?.name)
      .filter(Boolean); // Filter out cafés without names

    cafeNames.forEach((cafeName) => {
      if (!this.cafeImages[cafeName]) {
        this.unsplashService.searchImages(`${cafeName} café`, 1).subscribe({
          next: (response) => {
            const results = response.results;
            if (results && results.length > 0) {
              const selectedImage = results[0].urls.small;
              this.cafeImages[cafeName] = selectedImage;
            }
          },
          error: (err) =>
            console.error(`Error fetching image for ${cafeName}:`, err),
        });
      }
    });
  }
}
