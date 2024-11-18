import { Component, Injectable } from '@angular/core';
import { createStore, withProps } from '@ngneat/elf';
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
} from '@angular/fire/auth';
import {
  Firestore,
  addDoc,
  collection,
  doc,
  getDoc,
} from '@angular/fire/firestore';
import { Observable, from, map, of, switchMap } from 'rxjs';

export interface SessionStoreProps {
  logoutTime: string | null;
}

@Injectable({ providedIn: 'root' })
export class sessionStoreRepository {
  private store = this.createStore;

  constructor(
    private readonly firebaseAuth: Auth,
    private readonly firestore: Firestore
  ) {}

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
      const usersCollection = collection(this.firestore, 'users');
      await addDoc(usersCollection, {
        uid: user.uid,
        name: name,
        dob: dob,
        email: email,
        createdAt: new Date().toISOString(),
      });
    });

    return from(promise);
  }

  // Get the current user's UID if logged in
  getCurrentUserUID(): Observable<string | null> {
    return new Observable<string | null>((observer) => {
      onAuthStateChanged(this.firebaseAuth, (user) => {
        observer.next(user ? user.uid : null);
        observer.complete();
      });
    });
  }

  // Fetch the profile data from Firestore for a specific UID
  getUserProfile(uid: string): Observable<any> {
    const userDocRef = doc(this.firestore, `user/${uid}`);
    return from(getDoc(userDocRef)).pipe(
      map((docSnapshot) => (docSnapshot.exists() ? docSnapshot.data() : null))
    );
  }

  getSignedInUserProfile(): Observable<any> {
    return this.getCurrentUserUID().pipe(
      switchMap((uid) => (uid ? this.getUserProfile(uid) : of(null)))
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
