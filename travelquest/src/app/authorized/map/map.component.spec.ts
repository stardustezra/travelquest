import { HttpClient } from '@angular/common/http';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { MapComponent } from './map.component';
import { LocationService } from '../location.service';
import { HttpClientModule } from '@angular/common/http';
import { SnackbarService } from '../../shared/snackbar/snackbar.service';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel support
import { of, throwError } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

// Mock class for LocationService
class MockLocationService {
  searchLocations = jasmine.createSpy().and.returnValue(of([])); // Mock empty result
}

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let locationService: MockLocationService;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let httpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(async () => {
    snackbarService = jasmine.createSpyObj('SnackbarService', ['error']);
    httpClient = jasmine.createSpyObj('HttpClient', ['get']);

    await TestBed.configureTestingModule({
      imports: [HttpClientModule, MatIconModule, MatButtonModule, FormsModule],
      declarations: [MapComponent],
      providers: [
        { provide: LocationService, useClass: MockLocationService },
        { provide: MatDialog, useValue: {} },
        { provide: SnackbarService, useValue: snackbarService },
        { provide: HttpClient, useValue: httpClient }, // Mock HttpClient
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    locationService = TestBed.inject(LocationService) as any;
    fixture.detectChanges();
  });

  it('should call HTTP request to fetch nearby coffee places', fakeAsync(() => {
    const mockCoffeePlaces = [
      { name: 'Coffee Shop 1', lat: 40.73061, lon: -73.935242 },
      { name: 'Coffee Shop 2', lat: 40.73065, lon: -73.935245 },
    ];

    // Mock the HTTP GET method to return a valid response
    httpClient.get.and.returnValue(of({ elements: mockCoffeePlaces }));

    // Set a fake location marker for the test
    const locationMarker = {
      getLatLng: () => ({ lat: 40.73061, lng: -73.935242 }),
    };
    component['locationMarker'] = locationMarker; // Ensure it's set correctly

    // Call the method
    component.findNearbyCoffeePlaces();

    // Simulate passage of time for async HTTP call
    tick(); // This is crucial for async calls

    // Ensure that HTTP GET was called with the correct URL
    expect(httpClient.get).toHaveBeenCalledWith(
      'https://overpass-api.de/api/interpreter?data='
    );

    // Verify that the selectedCafe has been updated with the correct data
    expect(component.selectedCafe).toEqual({
      name: 'Coffee Shop 1',
      address: '',
    });
  }));

  it('should call locationService.searchLocations and update searchResults if query is valid', () => {
    const mockResults = [{ name: 'Location 1' }, { name: 'Location 2' }];
    locationService.searchLocations.and.returnValue(of(mockResults));

    // Set up location marker
    const locationMarker = {
      getLatLng: () => ({ lat: 40.73061, lng: -73.935242 }),
    };
    component['locationMarker'] = locationMarker;

    // Call searchLocation with a valid query
    component.searchLocation('valid query');

    // Ensure the service is called with the correct query
    expect(locationService.searchLocations).toHaveBeenCalledWith(
      'valid query',
      40.73061,
      -73.935242,
      1000
    );

    // Verify that the search results are updated
    expect(component.searchResults).toEqual(mockResults);
  });
});
