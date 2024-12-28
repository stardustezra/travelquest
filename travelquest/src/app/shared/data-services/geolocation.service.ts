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
      // Step 1: Generate geohash for the location
      const geohash = geohashForLocation([latitude, longitude]);

      // Step 2: Reference to the user's document in the `publicProfiles` collection
      const publicProfileRef = doc(
        this.firestore,
        `${this.publicProfilesCollection}/${userId}`
      );

      // Step 3: Create the geolocation data object
      const geoData = {
        geohash,
        location: { lat: latitude, lng: longitude },
      };

      // Step 4: Save geolocation data to Firestore
      await setDoc(publicProfileRef, geoData, { merge: true }); // Merge to preserve existing data
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
    userHashtags: any[] // Updated type for flexibility
  ): Promise<any[]> {
    const bounds = geohashQueryBounds([latitude, longitude], radiusInKm * 1000);
    const publicProfilesRef = collection(
      this.firestore,
      this.publicProfilesCollection
    );
    const matchingUsers: any[] = [];

    // Normalize user hashtags
    const normalizedUserHashtags = userHashtags
      .map((h) =>
        h && typeof h === 'object' && h.tag ? h.tag.trim().toLowerCase() : null
      )
      .filter((tag) => tag !== null);

    for (const b of bounds) {
      const q = query(
        publicProfilesRef,
        where('geohash', '>=', b[0]),
        where('geohash', '<=', b[1])
      );

      const snapshot = await getDocs(q);

      snapshot.forEach((doc) => {
        const data = doc.data();

        const hashtags = Array.isArray(data['hashtags'])
          ? data['hashtags']
          : [];
        const normalizedHashtags = hashtags
          .map((h) =>
            h && typeof h === 'object' && h.tag
              ? h.tag.trim().toLowerCase()
              : null
          )
          .filter((tag) => tag !== null);

        const hasMatchingHashtags = normalizedHashtags.some((hashtag) =>
          normalizedUserHashtags.includes(hashtag)
        );

        if (hasMatchingHashtags) {
          matchingUsers.push({ id: doc.id, ...data });
        }
      });
    }

    return matchingUsers;
  }
}
