import { Injectable, inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { sessionStoreRepository } from '../stores/session-store.repository';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
  constructor(
    private readonly router: Router,
    private readonly sessionStore: sessionStoreRepository
  ) {}

  canActivate(): Observable<UrlTree | boolean> {
    return this.sessionStore.getCurrentUserUID().pipe(
      map((uid) => {
        if (uid) {
          return true;
        } else {
          console.warn(
            'AuthGuard: User not authenticated, redirecting to login'
          );
          return this.router.createUrlTree(['/auth/login']);
        }
      })
    );
  }
}

export const isAuthed = () => {
  return inject(AuthGuard).canActivate();
};
