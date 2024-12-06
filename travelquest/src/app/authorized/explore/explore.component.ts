import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  doc,
  getDoc,
} from '@angular/fire/firestore';
import { GeolocationService } from '../../shared/data-services/geolocation.service';
import { Observable, from } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';

interface User {
  name: string;
  profilePhoto: string;
  age: number;
  country: string;
  hashtags: string[];
  location: { latitude: number; longitude: number };
}

@Component({
  selector: 'travelquest-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
})
export class ExploreComponent implements OnInit {
  currentUserHashtags: string[] = [];
  nearbyUsers$: Observable<User[]> | null = null;

  constructor(
    private firestore: Firestore,
    private geolocationService: GeolocationService
  ) {}

  ngOnInit(): void {
    // Fetch current user's hashtags and location
    this.geolocationService.getCurrentUserLocation().subscribe((location) => {
      this.fetchNearbyUsers(location.latitude, location.longitude);
    });
  }

  fetchNearbyUsers(lat: number, lng: number): void {
    const publicProfilesRef = collection(this.firestore, 'publicProfiles');
    this.nearbyUsers$ = this.getCurrentUserHashtags().pipe(
      switchMap((hashtags) => {
        this.currentUserHashtags = hashtags;

        // Firestore query for users with matching hashtags within the location range
        return collectionData(
          query(
            publicProfilesRef,
            where('hashtags', 'array-contains-any', hashtags),
            where('location.latitude', '>=', lat - 0.045),
            where('location.latitude', '<=', lat + 0.045),
            where('location.longitude', '>=', lng - 0.045),
            where('location.longitude', '<=', lng + 0.045)
          ),
          { idField: 'id' }
        );
      }),
      map((users: any[]) => users as User[]) // Map the result to `User` interface
    );
  }

  getCurrentUserHashtags(): Observable<string[]> {
    // Replace this Firestore query to fetch the current user's hashtags
    const currentUserId = 'current-user-id'; // Replace with actual logic to get user ID
    const currentUserRef = doc(
      this.firestore,
      `publicProfiles/${currentUserId}`
    );
    return from(getDoc(currentUserRef)).pipe(
      map((docSnapshot) => {
        const data = docSnapshot.data();
        return data ? (data['hashtags'] as string[]) : []; // Access 'hashtags' with bracket notation
      })
    );
  }
}
