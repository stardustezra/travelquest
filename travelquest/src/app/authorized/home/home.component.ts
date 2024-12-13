import { Component, OnInit } from '@angular/core';
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';
import { OverpassService } from '../../shared/data-services/overpass.service';
import { UnsplashService } from '../../shared/data-services/unsplash.service';
import { PlacesRepository } from '../../shared/stores/places.store';
import { Router } from '@angular/router';

@Component({
  selector: 'travelquest-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  userName: string = '';
  userLocation: { latitude: number; longitude: number } | null = null;
  nearbyCafes: any[] = [];
  nearbyRestaurants: any[] = [];
  nearbyCulturalPlaces: any[] = [];
  cafeImages: { [key: string]: string } = {};
  restaurantImages: { [key: string]: string } = {};
  culturalPlaceImages: { [key: string]: string } = {};

  constructor(
    private sessionStore: sessionStoreRepository,
    private overpassService: OverpassService,
    private unsplashService: UnsplashService,
    private placesRepository: PlacesRepository,
    private router: Router // Inject Router for navigation
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

          // Fetch nearby places
          if (this.userLocation) {
            this.loadCafes();
            this.loadRestaurants();
            this.loadCulturalPlaces();
          }
        },
        (error: GeolocationPositionError) => {
          console.error('Geolocation error:', error.message);
        }
      );
    }
  }

  goToInbox(): void {
    this.router.navigate(['/inbox']); // Navigate to the 'Inbox' page
  }

  loadCafes(): void {
    this.placesRepository.cafes$.subscribe((cachedCafes) => {
      if (cachedCafes.length > 0) {
        this.nearbyCafes = cachedCafes.slice(0, 4); // Limit to 4 cafés
        this.fetchCafeImages();
      } else {
        this.fetchNearbyCafes();
      }
    });
  }

  loadRestaurants(): void {
    this.placesRepository.restaurants$.subscribe((cachedRestaurants) => {
      if (cachedRestaurants.length > 0) {
        this.nearbyRestaurants = cachedRestaurants.slice(0, 4); // Limit to 4 restaurants
        this.fetchRestaurantImages();
      } else {
        this.fetchNearbyRestaurants();
      }
    });
  }

  loadCulturalPlaces(): void {
    this.placesRepository.culturalPlaces$.subscribe((cachedPlaces) => {
      if (cachedPlaces.length > 0) {
        this.nearbyCulturalPlaces = cachedPlaces.slice(0, 4); // Limit to 4 cultural places
        this.fetchCulturalPlaceImages();
      } else {
        this.fetchNearbyCulturalPlaces();
      }
    });
  }

  fetchNearbyCafes(): void {
    if (this.userLocation) {
      const { latitude, longitude } = this.userLocation;

      this.overpassService.fetchNearbyCafes(latitude, longitude).subscribe({
        next: (data) => {
          const cafes = data.elements || [];
          this.nearbyCafes = cafes.slice(0, 4); // Limit to 4 cafés
          this.placesRepository.updateCafes(cafes); // Cache data
          this.fetchCafeImages();
        },
        error: (err) => console.error('Error fetching nearby cafés:', err),
      });
    }
  }

  fetchNearbyRestaurants(): void {
    if (this.userLocation) {
      const { latitude, longitude } = this.userLocation;

      this.overpassService
        .fetchNearbyRestaurants(latitude, longitude)
        .subscribe({
          next: (data) => {
            const restaurants = data.elements || [];
            this.nearbyRestaurants = restaurants.slice(0, 4); // Limit to 4 restaurants
            this.placesRepository.updateRestaurants(restaurants); // Cache data
            this.fetchRestaurantImages();
          },
          error: (err) =>
            console.error('Error fetching nearby restaurants:', err),
        });
    }
  }

  fetchNearbyCulturalPlaces(): void {
    if (this.userLocation) {
      const { latitude, longitude } = this.userLocation;

      this.overpassService
        .fetchNearbyCulturalPlaces(latitude, longitude)
        .subscribe({
          next: (data) => {
            const places = data.elements || [];
            this.nearbyCulturalPlaces = places.slice(0, 4); // Limit to 4 cultural places
            this.placesRepository.updateCulturalPlaces(places); // Cache data
            this.fetchCulturalPlaceImages();
          },
          error: (err) =>
            console.error('Error fetching nearby cultural places:', err),
        });
    }
  }

  fetchCafeImages(): void {
    this.nearbyCafes.forEach((cafe) => {
      const cafeName = cafe.tags?.name;
      if (cafeName && !this.cafeImages[cafeName]) {
        this.unsplashService.searchImages(`${cafeName} café`, 1).subscribe({
          next: (response) => {
            if (response.results && response.results.length > 0) {
              this.cafeImages[cafeName] = response.results[0].urls.small;
            }
          },
          error: (err) =>
            console.error(`Error fetching image for ${cafeName}:`, err),
        });
      }
    });
  }

  fetchRestaurantImages(): void {
    this.nearbyRestaurants.forEach((restaurant) => {
      const restaurantName = restaurant.tags?.name;
      if (restaurantName && !this.restaurantImages[restaurantName]) {
        this.unsplashService
          .searchImages(`${restaurantName} restaurant`, 1)
          .subscribe({
            next: (response) => {
              if (response.results && response.results.length > 0) {
                this.restaurantImages[restaurantName] =
                  response.results[0].urls.small;
              }
            },
            error: (err) =>
              console.error(`Error fetching image for ${restaurantName}:`, err),
          });
      }
    });
  }

  fetchCulturalPlaceImages(): void {
    this.nearbyCulturalPlaces.forEach((place) => {
      const placeName = place.tags?.name;
      if (placeName && !this.culturalPlaceImages[placeName]) {
        this.unsplashService
          .searchImages(`${placeName} cultural place`, 1)
          .subscribe({
            next: (response) => {
              if (response.results && response.results.length > 0) {
                this.culturalPlaceImages[placeName] =
                  response.results[0].urls.small;
              }
            },
            error: (err) =>
              console.error(`Error fetching image for ${placeName}:`, err),
          });
      }
    });
  }
}
