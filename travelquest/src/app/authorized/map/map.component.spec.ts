import { TestBed, ComponentFixture } from '@angular/core/testing';
import { MapComponent } from './map.component';
import { LocationService } from '../location.service';
import { MatDialog } from '@angular/material/dialog';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SnackbarService } from '../../shared/snackbar/snackbar.service';
import { PLATFORM_ID } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Import FormsModule
import { MatIconModule } from '@angular/material/icon';
import { of } from 'rxjs';

// Mock services
class MockLocationService {
  searchLocations(query: string, lat: number, lon: number, radius: number) {
    return of([]); // Mock response
  }
}

class MockSnackbarService {
  error(message: string) {
    console.error(message);
  }
}

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapComponent],
      providers: [
        { provide: LocationService, useClass: MockLocationService },
        { provide: MatDialog, useValue: {} },
        { provide: SnackbarService, useClass: MockSnackbarService },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
      imports: [HttpClientTestingModule, FormsModule, MatIconModule], // Include FormsModule here
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the map after view init', async () => {
    await component.ngAfterViewInit();
    expect(component['map']).toBeDefined(); // Check if the map instance is defined
  });

  it('should search for locations', () => {
    const mockResults = [
      { name: 'Mock Location', lat: 40.73061, lon: -73.935242 },
    ];
    const locationService = TestBed.inject(LocationService);
    spyOn(locationService, 'searchLocations').and.returnValue(of(mockResults));

    component.locationMarkerForTesting = {
      getLatLng: () => ({ lat: 40.73061, lng: -73.935242 }),
    };

    component.searchLocation('Test Query');
    expect(component.searchResults).toEqual(mockResults);
  });

  it('should handle search with no location marker', () => {
    component.locationMarkerForTesting = null;
    component.searchLocation('Test Query');
    expect(component.searchResults).toEqual([]);
  });
});
