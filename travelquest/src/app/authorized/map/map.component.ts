import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  ViewEncapsulation,
} from '@angular/core';
import * as L from 'leaflet';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { SafetyTipsDialogComponent } from '../../shared/components/safety-tips-dialog/safety-tips-dialog.component';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  encapsulation: ViewEncapsulation.None, // Ensures global styles for Leaflet elements
})
export class MapComponent implements AfterViewInit {
  private map: any;
  private locationMarker: any;
  private markers: any[] = []; // Stores all coffee shop markers
  public selectedLocation: any = null; // Details of the selected marker
  public isMenuOpen: boolean = false; // Controls the visibility of the details menu
  public searchQuery: string = ''; // Holds the search query

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private http: HttpClient,
    private dialog: MatDialog
  ) {}

  async ngAfterViewInit(): Promise<void> {
    await this.initMap();
  }

  private async initMap(): Promise<void> {
    if (isPlatformBrowser(this.platformId)) {
      const L = await import('leaflet');
      const isMobile = window.innerWidth <= 600;

      this.map = L.map('map', {
        zoomControl: !isMobile,
      }).setView([40.73061, -73.935242], 12);

      if (!isMobile) {
        L.control.zoom({ position: 'bottomleft' }).addTo(this.map);
      }

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(this.map);

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
          (error) => console.warn('Geolocation failed:', error)
        );
      }
    }
  }

  // Add user location marker
  private addLocationMarker(coords: [number, number], L: any): void {
    const userIcon = L.divIcon({
      className: 'custom-location-marker',
      html: '<div class="pin"></div><div class="pulse"></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    if (this.locationMarker) {
      this.locationMarker.setLatLng(coords);
    } else {
      this.locationMarker = L.marker(coords, { icon: userIcon }).addTo(
        this.map
      );
    }
  }

  // Fetch address from Nominatim API
  private fetchAddress(lat: number, lon: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
    return this.http
      .get<any>(url)
      .toPromise()
      .then((data) => {
        return data.display_name || 'Address not found';
      });
  }

  // Add coffee shop marker with click functionality
  private addCoffeeMarker(
    coords: [number, number],
    name: string,
    L: any
  ): void {
    const coffeeIcon = L.divIcon({
      className: 'coffee-marker',
      html: '<div style="font-size: 24px; line-height: 24px; text-align: center;">☕</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const marker = L.marker(coords, { icon: coffeeIcon }).addTo(this.map);

    // Attach click event to the marker
    marker.on('click', async () => {
      await this.showLocationDetails(marker.getLatLng(), name);
    });

    this.markers.push(marker);
  }

  // Show location details menu
  async showLocationDetails(
    coords: { lat: number; lng: number },
    name: string
  ): Promise<void> {
    const address = await this.fetchAddress(coords.lat, coords.lng);

    this.selectedLocation = {
      name,
      address,
      openingHours: '8:00 AM - 8:00 PM',
      tags: ['#coffee', '#cozy', '#wifi'],
    };
    this.isMenuOpen = true; // Open the location details menu
  }

  // Find nearby coffee shops using Overpass API
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

        // Add a marker for each coffee shop
        this.addCoffeeMarker([coffeeLat, coffeeLon], name, L);
      });
    });
  }

  // Drop a pin on the map
  async dropPin(): Promise<void> {
    const L = await import('leaflet');
    const center = this.map.getCenter();
    const coords: [number, number] = [center.lat, center.lng];

    const pinIcon = L.divIcon({
      className: 'drop-pin-marker',
      html: '<div style="color: red;">📍</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    L.marker(coords, { icon: pinIcon }).addTo(this.map);

    const address = await this.fetchAddress(center.lat, center.lng);
    alert(`Pin dropped at: ${address}`);
  }

  // Open safety tips dialog
  openSafetyTips(): void {
    this.dialog.open(SafetyTipsDialogComponent, {
      width: '300px',
      data: {},
    });
  }

  // Handle location search
  searchLocation(searchTerm: string): void {
    if (!searchTerm) return;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      searchTerm
    )}`;

    this.http.get<any[]>(url).subscribe((data) => {
      if (data && data.length > 0) {
        const location = data[0];
        const coords: [number, number] = [
          parseFloat(location.lat),
          parseFloat(location.lon),
        ];

        // Center the map on the new coordinates and place a marker
        this.map.setView(coords, 15);
        this.addLocationMarker(coords, L);
      } else {
        alert('Location not found');
      }
    });
  }
}
