import { Component, OnInit } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  doc,
  getDoc,
  GeoPoint,
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
  location: GeoPoint; // Updated to use Firestore's GeoPoint
}

@Component({
  selector: 'travelquest-explore',
  templateUrl: './explore.component.html',
  styleUrls: ['./explore.component.scss'],
})
export class ExploreComponent implements OnInit {
  currentUserHashtags: string[] = [];
  nearbyUsers$: Observable<User[]> | null = null;
  maxDistance = 50; // Maximum distance in kilometers

  constructor(
    private firestore: Firestore,
    private geolocationService: GeolocationService
  ) {}

  ngOnInit(): void {
    // Fetch current user's hashtags and location
    this.geolocationService.watchUserLocation().subscribe((location) => {
      if (location) {
        this.fetchNearbyUsers(location.latitude, location.longitude);
      }
    });
  }

  fetchNearbyUsers(lat: number, lng: number): void {
    const publicProfilesRef = collection(this.firestore, 'publicProfiles');
    this.nearbyUsers$ = this.getCurrentUserHashtags().pipe(
      switchMap((hashtags) => {
        this.currentUserHashtags = hashtags;

        // Fetch users with matching hashtags
        return collectionData(
          query(
            publicProfilesRef,
            where('hashtags', 'array-contains-any', hashtags)
          ),
          { idField: 'id' }
        );
      }),
      map((users: any[]) => {
        // Filter users by distance using GeoPoint
        return users.filter((user: User) => {
          const userLocation = user.location as GeoPoint;
          const distance = this.calculateDistance(
            lat,
            lng,
            userLocation.latitude,
            userLocation.longitude
          );
          return distance <= this.maxDistance;
        });
      })
    );
  }

  getCurrentUserHashtags(): Observable<string[]> {
    const currentUserId = 'current-user-id'; // Replace with actual logic to get user ID
    const currentUserRef = doc(
      this.firestore,
      `publicProfiles/${currentUserId}`
    );
    return from(getDoc(currentUserRef)).pipe(
      map((docSnapshot) => {
        const data = docSnapshot.data();
        return data ? (data['hashtags'] as string[]) : [];
      })
    );
  }

  // Calculate distance between two GeoPoints using the Haversine formula
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
