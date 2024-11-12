import { Component, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
})
export class MapComponent implements AfterViewInit {
  private map: any; // Use 'any' because L will be dynamically imported
  private locationMarker: any; // Custom marker for user's location

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private async initMap(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const L = await import('leaflet'); // Dynamically import Leaflet

      // Default coordinates if geolocation fails
      const defaultCoords: [number, number] = [40.73061, -73.935242];

      // Initialize map centered at default location
      this.map = L.map('map', {
        zoomControl: false, // Disable default zoom controls
      }).setView(defaultCoords, 12);

      // Use a modern tile layer (like in your image)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(this.map);

      // Get user geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userCoords: [number, number] = [
              position.coords.latitude,
              position.coords.longitude,
            ];
            this.map.setView(userCoords, 15); // Center map at user's location
            this.addLocationMarker(userCoords); // Add custom marker
          },
          (error) => {
            console.warn('Geolocation failed:', error);
          }
        );
      } else {
        console.warn('Geolocation is not supported by this browser.');
      }
    }
  }

  private addLocationMarker(coords: [number, number]): void {
    const L = this.map.constructor; // Use loaded Leaflet instance

    // Remove any existing marker
    if (this.locationMarker) {
      this.map.removeLayer(this.locationMarker);
    }

    // Create a custom marker icon
    const userIcon = L.divIcon({
      className: 'custom-location-marker', // Link this to custom CSS
      html: '<div class="pin"></div><div class="pulse"></div>',
      iconSize: [24, 24], // Adjust size if needed
      iconAnchor: [12, 12], // Center the marker on the location
    });

    // Add the custom marker to the map
    this.locationMarker = L.marker(coords, { icon: userIcon }).addTo(this.map);
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initMap();
  }
}
