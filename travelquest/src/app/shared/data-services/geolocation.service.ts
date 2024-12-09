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
    userHashtags: any[] // Updated type for flexibility
  ): Promise<any[]> {
    const bounds = geohashQueryBounds([latitude, longitude], radiusInKm * 1000);
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

    // Normalize user hashtags
    const normalizedUserHashtags = userHashtags
      .map((h) =>
        h && typeof h === 'object' && h.tag ? h.tag.trim().toLowerCase() : null
      )
      .filter((tag) => tag !== null);
    console.log('Normalized user hashtags:', normalizedUserHashtags);

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
        console.log('Fetched document:', doc.id, data);

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
        console.log('Normalized document hashtags:', normalizedHashtags);

        const hasMatchingHashtags = normalizedHashtags.some((hashtag) =>
          normalizedUserHashtags.includes(hashtag)
        );

        console.log(
          `User ${doc.id} has matching hashtags:`,
          hasMatchingHashtags
        );

        if (hasMatchingHashtags) {
          matchingUsers.push({ id: doc.id, ...data });
        }
      });
    }

    console.log(`Total matching users found: ${matchingUsers.length}`);
    return matchingUsers;
  }
}
