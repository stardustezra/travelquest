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
  selectedCafe: any = null; // Property to store selected cafe details

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

    if (this.locationMarker) {
      this.locationMarker.setLatLng(coords);
    } else {
      this.locationMarker = L.marker(coords, { icon: userIcon }).addTo(
        this.map
      );
    }
  }

  async ngAfterViewInit(): Promise<void> {
    await this.initMap();
  }

  searchLocation(query: string): void {
    if (!query || !this.locationMarker) {
      this.searchResults = [];
      return;
    }

    const userLat = this.locationMarker.getLatLng().lat;
    const userLon = this.locationMarker.getLatLng().lng;
    const radius = 1000;

    this.locationService
      .searchLocations(query, userLat, userLon, radius)
      .subscribe(
        (results) => {
          this.searchResults = results;
        },
        (error) => {
          console.error('Error fetching locations:', error);
        }
      );
  }

  selectLocation(location: any): void {
    this.selectedLocation = location;
    this.isMenuOpen = true;
    this.map.setView([location.lat, location.lon], 15);
    this.addLocationMarker([location.lat, location.lon], import('leaflet'));
  }

  reverseGeocode(lat: number, lon: number): Promise<string> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;

    return this.http
      .get(url)
      .toPromise()
      .then((data: any) => {
        if (data && data.address) {
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
  }

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
      this.map.eachLayer((layer: any) => {});

      data.elements.forEach((element: any) => {
        const coffeeLat = element.lat;
        const coffeeLon = element.lon;
        const name = element.tags.name || 'Unnamed Cafe';

        let address = [
          element.tags['addr:housenumber'],
          element.tags['addr:street'],
          element.tags['addr:suburb'],
          element.tags['addr:city'],
          element.tags['addr:state'],
          element.tags['addr:postcode'],
        ]
          .filter(Boolean)
          .join(', ');

        if (!address) {
          this.reverseGeocode(coffeeLat, coffeeLon).then((geoAddress) => {
            address = geoAddress;
            const coffeeIcon = L.divIcon({
              className: 'coffee-marker',
              html: '<div style="font-size: 24px; line-height: 24px; text-align: center;">☕</div>',
              iconSize: [30, 30],
              iconAnchor: [15, 15],
            });

            const marker = L.marker([coffeeLat, coffeeLon], {
              icon: coffeeIcon,
            })
              .addTo(this.map)
              .on('click', () => {
                this.selectedCafe = { name, address };
              });
            marker.bindPopup(`<b>${name}</b><br>${address}`);
          });
        } else {
          const coffeeIcon = L.divIcon({
            className: 'coffee-marker',
            html: '<div style="font-size: 24px; line-height: 24px; text-align: center;">☕</div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });

          const marker = L.marker([coffeeLat, coffeeLon], { icon: coffeeIcon })
            .addTo(this.map)
            .on('click', () => {
              this.selectedCafe = { name, address };
            });
          marker.bindPopup(`<b>${name}</b><br>${address}`);
        }
      });
    });
  } //TODO: Add #

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
