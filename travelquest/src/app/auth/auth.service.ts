import { Injectable, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Observable, from, map, of, switchMap } from 'rxjs';
import { sessionStoreRepository } from '../shared/stores/session-store.repository';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  firebaseAuth = inject(Auth);
  private firestore = inject(Firestore);

  constructor(private readonly sessionStore: sessionStoreRepository) {}
}
