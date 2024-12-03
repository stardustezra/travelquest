import { createStore, withProps, select } from '@ngneat/elf';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface PlacesState {
  cafes: any[];
  restaurants: any[];
  culturalPlaces: any[];
}

const initialState: PlacesState = {
  cafes: [],
  restaurants: [],
  culturalPlaces: [],
};

const placesStore = createStore(
  { name: 'places' },
  withProps<PlacesState>(initialState)
);

@Injectable({ providedIn: 'root' })
export class PlacesRepository {
  cafes$: Observable<any[]> = placesStore.pipe(select((state) => state.cafes));
  restaurants$: Observable<any[]> = placesStore.pipe(
    select((state) => state.restaurants)
  );
  culturalPlaces$: Observable<any[]> = placesStore.pipe(
    select((state) => state.culturalPlaces)
  );

  updateCafes(cafes: any[]): void {
    placesStore.update((state) => ({ ...state, cafes }));
  }

  updateRestaurants(restaurants: any[]): void {
    placesStore.update((state) => ({ ...state, restaurants }));
  }

  updateCulturalPlaces(culturalPlaces: any[]): void {
    placesStore.update((state) => ({ ...state, culturalPlaces }));
  }
}
