import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Observable, from, map, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  firebaseAuth = inject(Auth);
  private firestore = inject(Firestore);

  // Register a new user and set the display name
  register(email: string, name: string, password: string): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password
    ).then((response) => updateProfile(response.user, { displayName: name }));
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
    const userDocRef = doc(this.firestore, `users/${uid}`);
    return from(getDoc(userDocRef)).pipe(
      map((docSnapshot) => (docSnapshot.exists() ? docSnapshot.data() : null))
    );
  }

  getSignedInUserProfile(): Observable<any> {
    return this.getCurrentUserUID().pipe(
      switchMap((uid) => (uid ? this.getUserProfile(uid) : of(null)))
    );
  }
}
