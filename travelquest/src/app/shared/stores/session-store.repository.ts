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

      // Save user info to Firestore
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Only create the document if it doesn't exist
        await setDoc(userDocRef, {
          uid: user.uid,
          name: name,
          dob: dob,
          email: email,
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

  // Fetch the profile data from Firestore for a specific UID
  getUserProfile(uid: string): Observable<any> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    console.log('Fetching document at path:', userDocRef.path);
    return from(getDoc(userDocRef)).pipe(
      map((docSnapshot) => (docSnapshot.exists() ? docSnapshot.data() : null))
    );
  }

  getSignedInUserProfile(): Observable<any> {
    return this.getCurrentUserUID().pipe(
      switchMap((uid) => (uid ? this.getUserProfile(uid) : of(null)))
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
    console.log('Updating user profile:', data);

    return setDoc(userDocRef, data, { merge: true }) // Use merge to only update fields
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

  private createStore(): typeof store {
    const store = createStore(
      { name: 'sessionStore' },
      withProps<SessionStoreProps>({ logoutTime: null })
    );

    return store;
  }
}
