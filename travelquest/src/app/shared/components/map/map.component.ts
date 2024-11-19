import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { SafetyTipsDialogComponent } from '../safety-tips-dialog/safety-tips-dialog.component';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.None, // Ensures global styles for Leaflet elements
})
export class MapComponent implements AfterViewInit {
  private map: any;
  private locationMarker: any; // The marker for the user's location

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private dialog: MatDialog
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

      // Initialize the map with a default view (New York coordinates)
      this.map = L.map('map', {
        zoomControl: false,
      }).setView([40.73061, -73.935242], 12); // Initial view of the map

      // Add custom zoom control at the bottom-left
      L.control.zoom({ position: 'bottomleft' }).addTo(this.map);

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

      // Add the safety button at the bottom
      this.addSafetyButton(L);
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

  // Finds nearby coffee places by querying Overpass API
  async findNearbyCoffeePlaces(): Promise<void> {
    const L = await import('leaflet');
    if (!this.locationMarker) {
      console.warn('User location not available');
      return;
    }

    // Get current location of the user
    const userLat = this.locationMarker.getLatLng().lat;
    const userLon = this.locationMarker.getLatLng().lng;

    // Overpass API query to find coffee places near user location
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

    // Fetch coffee places from Overpass API
    this.http.get(url).subscribe((data: any) => {
      // Add new markers for each coffee place found
      data.elements.forEach((element: any) => {
        const coffeeLat = element.lat;
        const coffeeLon = element.lon;
        const name = element.tags.name || 'Unnamed Cafe';

        // Create a custom marker with a coffee emoji
        const coffeeIcon = L.divIcon({
          className: 'coffee-marker',
          html: '<div style="font-size: 24px; line-height: 24px; text-align: center;">☕</div>', // Coffee emoji
          iconSize: [30, 30], // Size of the emoji
          iconAnchor: [15, 15], // Anchor the marker at the center
        });

        // Create a marker with the custom coffee emoji
        L.marker([coffeeLat, coffeeLon], { icon: coffeeIcon })
          .addTo(this.map)
          .bindPopup(`<b>${name}</b>`)
          .openPopup();
      });
    });
  }

  // Add the safety button at the bottom-right of the map
  private addSafetyButton(L: any): void {
    const safetyButtonControl = L.control({ position: 'bottomright' }); // Set position to bottom-right

    safetyButtonControl.onAdd = () => {
      const div = L.DomUtil.create('div', 'safety-button-container');
      div.innerHTML = `
        <button class="round-button safety-button" title="Safety Tips">
          🛡️
        </button>
      `;

      L.DomEvent.on(div, 'click', () => {
        this.openSafetyTips();
      });

      return div;
    };

    safetyButtonControl.addTo(this.map);
  }
}
