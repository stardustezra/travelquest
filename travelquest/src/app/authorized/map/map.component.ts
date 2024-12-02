import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LocationService } from '../location.service'; // Import LocationService
import { MatDialog } from '@angular/material/dialog';
import { SafetyTipsDialogComponent } from '../../shared/components/safety-tips-dialog/safety-tips-dialog.component';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet'; // Import Leaflet

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.None, // Ensures global styles for Leaflet elements
})
export class MapComponent implements AfterViewInit {
  private map: any;
  private locationMarker: any; // The marker for the user's location
  searchQuery: string = ''; // Search query for location search
  searchResults: any[] = []; // Array to store search results
  selectedLocation: any; // The currently selected location
  isMenuOpen: boolean = false; // Toggle the location details panel

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private locationService: LocationService, // Inject LocationService
    private dialog: MatDialog,
    private http: HttpClient
  ) {}

  // Open the safety tips dialog
  openSafetyTips(): void {
    this.dialog.open(SafetyTipsDialogComponent, {
      width: '300px',
      data: {},
    });
  }

  // Initializes the map when the component view has been initialized
  private async initMap(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const L = await import('leaflet'); // Dynamically load Leaflet

      // Check if the device is mobile based on screen width
      const isMobile = window.innerWidth <= 600;

      // Initialize the map with zoom control for PC (no zoom controls for mobile)
      this.map = L.map('map', {
        zoomControl: !isMobile, // Disable zoom controls on mobile (screen <= 600px)
      }).setView([40.73061, -73.935242], 12); // Initial view of the map

      // Add custom zoom control at the bottom-left if it's not mobile
      if (!isMobile) {
        L.control.zoom({ position: 'bottomleft' }).addTo(this.map);
      }

      // Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(this.map);

      // Try to get the user's geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userCoords: [number, number] = [
              position.coords.latitude,
              position.coords.longitude,
            ];
            this.map.setView(userCoords, 15); // Center map on user's location
            this.addLocationMarker(userCoords, L); // Add location marker
          },
          (error) => {
            console.warn('Geolocation failed:', error);
          }
        );
      }
    }
  }

  // Add the user's location marker to the map
  private addLocationMarker(coords: [number, number], L: any): void {
    const userIcon = L.divIcon({
      className: 'custom-location-marker',
      html: '<div class="pin"></div><div class="pulse"></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    // If a location marker already exists, update it
    if (this.locationMarker) {
      this.locationMarker.setLatLng(coords); // Update marker position
    } else {
      // If no marker exists, create a new one
      this.locationMarker = L.marker(coords, { icon: userIcon }).addTo(
        this.map
      );
    }
  }

  // This is required to implement the AfterViewInit interface
  async ngAfterViewInit(): Promise<void> {
    await this.initMap(); // Initialize map when the view has been initialized
  }

  // Finds locations based on search query (using LocationService)
  searchLocation(query: string): void {
    if (!query || !this.locationMarker) {
      this.searchResults = [];
      return;
    }

    const userLat = this.locationMarker.getLatLng().lat;
    const userLon = this.locationMarker.getLatLng().lng;
    const radius = 1000; // Define the search radius (1km)

    // Call the LocationService with the user's location and radius
    this.locationService
      .searchLocations(query, userLat, userLon, radius)
      .subscribe(
        (results) => {
          this.searchResults = results; // Update search results
        },
        (error) => {
          console.error('Error fetching locations:', error);
        }
      );
  }

  // Select a location from search results
  selectLocation(location: any): void {
    this.selectedLocation = location;
    this.isMenuOpen = true; // Open location details panel
    this.map.setView([location.lat, location.lon], 15); // Center map on the selected location
    this.addLocationMarker([location.lat, location.lon], import('leaflet')); // Add marker for selected location
  }

  /*   // Helper function to reverse geocode coordinates
  reverseGeocode(lat: number, lon: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

    return this.http
      .get(url)
      .toPromise()
      .then((data: any) => {
        if (data && data.address) {
          // Combine address components into a readable format
          const { road, house_number, suburb, city, postcode } = data.address;
          return (
            [house_number, road, suburb, city, postcode]
              .filter(Boolean)
              .join(', ') || 'Address not available'
          );
        }
        return 'Address not available';
      })
      .catch((error) => {
        console.error('Reverse geocoding failed:', error);
        return 'Address not available';
      });
  } */

  // Property to store selected cafe details
  selectedCafe: any = null;

  async findNearbyCoffeePlaces(): Promise<void> {
    const L = await import('leaflet');
    if (!this.locationMarker) {
      console.warn('User location not available');
      return;
    }

    const userLat = this.locationMarker.getLatLng().lat;
    const userLon = this.locationMarker.getLatLng().lng;

    const query = `
      [out:json];
      (
        node["amenity"="cafe"](around:1000,${userLat},${userLon});
        node["shop"="coffee"](around:1000,${userLat},${userLon});
        node["amenity"="coffee_shop"](around:1000,${userLat},${userLon});
        node["name"~"coffee|espresso", i](around:1000,${userLat},${userLon});
      );
      out body;
    `;

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
      query
    )}`;

    this.http.get(url).subscribe((data: any) => {
      // Clear existing markers
      this.map.eachLayer((layer: any) => {
        /*         if (layer instanceof L.Marker) {
          this.map.removeLayer(layer);
        } */
      });

      // Loop through each result
      data.elements.forEach((element: any) => {
        const coffeeLat = element.lat;
        const coffeeLon = element.lon;
        const name = element.tags.name || 'Unnamed Cafe';

        // Construct address from Overpass API tags, fallback if missing
        const address =
          [
            element.tags['addr:housenumber'],
            element.tags['addr:street'],
            element.tags['addr:suburb'],
            element.tags['addr:city'],
            element.tags['addr:state'],
            element.tags['addr:postcode'],
          ]
            .filter(Boolean)
            .join(', ') || 'Address not available';

        // Add marker immediately
        const coffeeIcon = L.divIcon({
          className: 'coffee-marker',
          html: '<div style="font-size: 24px; line-height: 24px; text-align: center;">☕</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const marker = L.marker([coffeeLat, coffeeLon], { icon: coffeeIcon })
          .addTo(this.map)
          .on('click', () => {
            // Update selectedCafe with name and address
            this.selectedCafe = { name, address };
          });

        marker.bindPopup(`<b>${name}</b><br>${address}`); // Optional popup with address
      });
    });
  }

  // Drop a pin at the current location on the map
  dropPin(): void {
    if (this.locationMarker) {
      const coords = this.locationMarker.getLatLng();
      const L = (window as any).L;

      const pinIcon = L.divIcon({
        className: 'custom-pin',
        html: '<div class="pin-drop"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      L.marker([coords.lat, coords.lng], { icon: pinIcon }).addTo(this.map);
    }
  }
}
