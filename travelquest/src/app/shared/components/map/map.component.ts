import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

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
    private http: HttpClient
  ) {}

  // Initializes the map when the component view has been initialized
  private async initMap(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const L = await import('leaflet');

      // Ensure Leaflet's default icons are properly loaded
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Initialize the map
      this.map = L.map('map', {
        zoomControl: false,
      }).setView([40.73061, -73.935242], 12); // Initial view

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
            this.addLocationMarker(userCoords, L); // Add user location marker
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

    // Add or update the user's location marker
    if (this.locationMarker) {
      this.locationMarker.setLatLng(coords);
    } else {
      this.locationMarker = L.marker(coords, { icon: userIcon }).addTo(
        this.map
      );
    }
  }

  // This is required to implement the AfterViewInit interface
  async ngAfterViewInit(): Promise<void> {
    await this.initMap();
  }

  // Finds nearby coffee places by querying Overpass API
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
      data.elements.forEach((element: any) => {
        const coffeeLat = element.lat;
        const coffeeLon = element.lon;
        const name = element.tags.name || 'Unnamed Cafe';

        const coffeeIcon = L.divIcon({
          className: 'custom-coffee-marker',
          html: `<mat-icon>room</mat-icon>`,
          iconSize: [36, 36],
          iconAnchor: [18, 36],
        });

        L.marker([coffeeLat, coffeeLon], { icon: coffeeIcon })
          .addTo(this.map)
          .bindPopup(`<b>${name}</b>`);
      });
    });
  }
}
