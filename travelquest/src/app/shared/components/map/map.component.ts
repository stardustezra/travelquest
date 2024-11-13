import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.None, // Ensures global styles for Leaflet elements
})
export class MapComponent implements AfterViewInit {
  private map: any;
  private locationMarker: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private async initMap(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const L = await import('leaflet');

      // Initialize map with zoom control at bottom-left
      this.map = L.map('map', {
        zoomControl: false, // Disable default zoom control
      }).setView([40.73061, -73.935242], 12);

      // Add custom zoom control at the bottom-right or bottom-left
      L.control
        .zoom({
          position: 'bottomleft', // Change to 'bottomleft' if desired
        })
        .addTo(this.map);

      // Tile Layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(this.map);

      // Geolocation and custom marker logic here...
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const userCoords: [number, number] = [
              position.coords.latitude,
              position.coords.longitude,
            ];
            this.map.setView(userCoords, 15);
            this.addLocationMarker(userCoords, L);
          },
          (error) => {
            console.warn('Geolocation failed:', error);
          }
        );
      }
    }
  }

  private addLocationMarker(coords: [number, number], L: any): void {
    const userIcon = L.divIcon({
      className: 'custom-location-marker',
      html: '<div class="pin"></div><div class="pulse"></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    this.locationMarker = L.marker(coords, { icon: userIcon }).addTo(this.map);
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initMap();
  }
}
