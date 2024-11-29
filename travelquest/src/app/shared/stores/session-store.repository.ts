import { Injectable } from '@angular/core';
import { createStore, withProps } from '@ngneat/elf';
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from '@angular/fire/auth';
import {
  Firestore,
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from '@angular/fire/firestore';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';
import { Observable, from, map, of, switchMap } from 'rxjs';
import { runTransaction } from 'firebase/firestore';

export interface SessionStoreProps {
  logoutTime: string | null;
}

@Injectable({ providedIn: 'root' })
export class sessionStoreRepository {
  private store = this.createStore();

  constructor(
    private readonly firebaseAuth: Auth,
    private readonly firestore: Firestore,
    private readonly storage: Storage
  ) {}

  // Register with email and password
  register(
    email: string,
    name: string,
    password: string,
    dob: string
  ): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    ).then(async (userCredential) => {
      const user = userCredential.user;

      // Update the user's profile with the display name
      await updateProfile(user, { displayName: name });

      // Convert the dob string to a Firestore Timestamp
      const dobTimestamp = Timestamp.fromDate(new Date(dob));

      // Save user info to Firestore
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Only create the document if it doesn't exist
        await setDoc(userDocRef, {
          uid: user.uid,
          name: name,
          dob: dobTimestamp,
          email: email,
          meetups: 0,
          createdAt: new Date().toISOString(),
        });
      }
    });

    return from(promise);
  }

  // Google Sign-In logic
  googleSignIn(): Observable<void> {
    const provider = new GoogleAuthProvider();

    const promise = signInWithPopup(this.firebaseAuth, provider).then(
      async (userCredential) => {
        const user = userCredential.user;

        if (user) {
          const userDocRef = doc(this.firestore, `users/${user.uid}`);
          const dob = '1970-01-01'; // Default DOB for Google users
          await setDoc(userDocRef, {
            uid: user.uid,
            name: user.displayName || 'Google User',
            dob: dob,
            email: user.email,
            meetups: 0, // Include meetups field here as well
            createdAt: new Date().toISOString(),
          });
        }
      }
    );

    return from(promise);
  }

  // Get the current user's UID if logged in
  getCurrentUserUID(): Observable<string | null> {
    return new Observable<string | null>((observer) => {
      onAuthStateChanged(this.firebaseAuth, (user) => {
        if (user) {
          console.log('Firebase Auth State Changed: User UID:', user.uid);
          observer.next(user.uid);
        } else {
          console.warn('Firebase Auth State Changed: No user logged in.');
          observer.next(null);
        }
        observer.complete();
      });
    });
  }

  getUserProfile(uid: string): Observable<any> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return from(getDoc(userDocRef)).pipe(
      switchMap(async (docSnapshot) => {
        if (docSnapshot.exists()) {
          // Use a defined interface or assertion to access meetups safely
          const data = docSnapshot.data() as { meetups?: number };

          // Check if 'meetups' field exists and add it if missing
          if (!('meetups' in data)) {
            console.log('Meetups field is missing. Adding it...');
            await setDoc(
              userDocRef,
              { meetups: 0 }, // Initialize meetups with a default value
              { merge: true }
            );
            data['meetups'] = 0; // Use bracket notation to safely add the property
          }

          return data;
        } else {
          console.warn('User document does not exist!');
          return null;
        }
      }),
      map((data) => data || null)
    );
  }

  getSignedInUserProfile(): Observable<any> {
    return this.getCurrentUserUID().pipe(
      switchMap((uid) =>
        uid
          ? this.getUserProfile(uid).pipe(
              map((profile) => {
                if (profile && profile.dob instanceof Timestamp) {
                  // Calculate the age using the dob as a Firestore Timestamp
                  const dob = profile.dob.toDate();
                  const currentDate = new Date();
                  const age = currentDate.getFullYear() - dob.getFullYear();
                  const month = currentDate.getMonth() - dob.getMonth();
                  if (
                    month < 0 ||
                    (month === 0 && currentDate.getDate() < dob.getDate())
                  ) {
                    // Subtract one year if the birthday hasn't occurred yet this year
                    return { ...profile, age: age - 1 };
                  }
                  return { ...profile, age: age }; // Return profile with calculated age
                }
                return profile;
              })
            )
          : of(null)
      )
    );
  }

  // Upload profile photo
  uploadProfilePhoto(file: File): Promise<string> {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const photoRef = ref(this.storage, `profilePhotos/${user.uid}`);
    return uploadBytes(photoRef, file).then(() =>
      getDownloadURL(photoRef).then((url: string) => {
        console.log('Uploaded photo URL:', url);
        return url;
      })
    );
  }

  // Save user profile
  saveUserProfile(data: any): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const userDocRef = doc(this.firestore, `users/${user.uid}`);

    return setDoc(userDocRef, data, { merge: true })
      .then(() => console.log('Profile updated successfully!'))
      .catch((error) => console.error('Error updating profile:', error));
  }

  // Fetch predefined hashtags from Firestore
  async fetchPredefinedHashtags(): Promise<
    { tag: string; category: string; color: string }[]
  > {
    const hashtagsRef = collection(this.firestore, 'hashtags');
    const snapshot = await getDocs(hashtagsRef);

    // Map Firestore documents to an array of hashtags
    return snapshot.docs.map(
      (doc) => doc.data() as { tag: string; category: string; color: string }
    );
  }

  signOut(): Promise<void> {
    return this.firebaseAuth
      .signOut()
      .then(() => {
        console.log('Successfully signed out');
        // Additional logic for clearing session data can be added here
      })
      .catch((error) => {
        console.error('Error signing out:', error);
        throw error;
      });
  }

  deleteAccount(): Promise<void> {
    const user = this.firebaseAuth.currentUser;
    if (user) {
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      //TODO: Maybe write about runTransaction in rapport
      return runTransaction(this.firestore, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);

        if (!userDoc.exists()) {
          throw new Error('User data not found in Firestore');
        }

        transaction.delete(userDocRef);
      })
        .then(() => {
          return user.delete();
        })
        .then(() => {
          console.log('User account and associated data deleted');
          // Additional logic (e.g., clearing session data, redirecting, etc.)
        })
        .catch((error) => {
          console.error('Error deleting user data or account:', error);
          throw error; // Ensure errors are thrown if something goes wrong
        });
    } else {
      return Promise.reject('No user is currently signed in');
    }
  }

  private createStore(): typeof store {
    const store = createStore(
      { name: 'sessionStore' },
      withProps<SessionStoreProps>({ logoutTime: null })
    );

    return store;
  }
}
