import { Injectable } from '@angular/core';
import {
  Firestore,
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from '@angular/fire/firestore';
import {
  geohashForLocation,
  geohashQueryBounds,
  distanceBetween,
} from 'geofire-common';
import { Hashtag } from '../models/user-profile.model';

@Injectable({
  providedIn: 'root',
})
export class GeoService {
  private publicProfilesCollection = 'publicProfiles';

  constructor(private firestore: Firestore) {}

  /**
   * Save or update geolocation data for a user
   * Updates the `geohash` and `location` fields in the user's public profile in the `publicProfiles` collection.
   */
  async saveUserLocation(
    userId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    try {
      console.log('saveUserLocation called with:', {
        userId,
        latitude,
        longitude,
      });

      // Step 1: Generate geohash for the location
      const geohash = geohashForLocation([latitude, longitude]);
      console.log(`Generated geohash for user ${userId}:`, geohash);

      // Step 2: Reference to the user's document in the `publicProfiles` collection
      const publicProfileRef = doc(
        this.firestore,
        `${this.publicProfilesCollection}/${userId}`
      );
      console.log(`Firestore reference created for user: ${userId}`);

      // Step 3: Create the geolocation data object
      const geoData = {
        geohash,
        location: { lat: latitude, lng: longitude },
      };
      console.log('Prepared geolocation data:', geoData);

      // Step 4: Save geolocation data to Firestore
      await setDoc(publicProfileRef, geoData, { merge: true }); // Merge to preserve existing data
      console.log(
        `Geolocation successfully saved to Firestore for user: ${userId}`
      );

      // Optional: Fetch and log back the saved data for verification
      const savedDoc = await getDocs(
        collection(this.firestore, this.publicProfilesCollection)
      );
      console.log(
        `Current state of publicProfiles collection:`,
        savedDoc.docs.map((d) => d.data())
      );
    } catch (error) {
      console.error('Error saving user location:', error);
      throw error; // Re-throw the error to handle it upstream if needed
    }
  }

  /**
   * Query nearby users within a radius
   */
  async findNearbyUsers(
    latitude: number,
    longitude: number,
    radiusInKm: number,
    userHashtags: string[]
  ): Promise<any[]> {
    const bounds = geohashQueryBounds([latitude, longitude], radiusInKm * 1000); // Get geohash bounds
    const publicProfilesRef = collection(
      this.firestore,
      this.publicProfilesCollection
    );
    const matchingUsers: any[] = [];

    console.log('findNearbyUsers called with:', {
      latitude,
      longitude,
      radiusInKm,
      userHashtags,
    });

    for (const b of bounds) {
      console.log('Query bounds:', b);
      const q = query(
        publicProfilesRef,
        where('geohash', '>=', b[0]),
        where('geohash', '<=', b[1])
      );

      const snapshot = await getDocs(q);
      console.log('Query results:', snapshot.docs.length);

      snapshot.forEach((doc) => {
        const data = doc.data();
        const { location } = data;

        const distance =
          distanceBetween([latitude, longitude], [location.lat, location.lng]) *
          1000; // Distance in meters

        console.log(`User ${doc.id} distance:`, distance);

        if (distance <= radiusInKm * 1000) {
          // Access hashtags using index signature to avoid errors
          const hashtags = data['hashtags'] as Hashtag[]; // Explicitly cast hashtags as Hashtag[]
          const hasMatchingHashtags = hashtags.some((hashtag) =>
            userHashtags.includes(hashtag.tag)
          );

          if (hasMatchingHashtags) {
            console.log(`User ${doc.id} matches hashtags.`);
            matchingUsers.push({ id: doc.id, ...data });
          }
        }
      });
    }

    console.log(`Total matching users found: ${matchingUsers.length}`);
    return matchingUsers;
  }
}
