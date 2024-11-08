import { Injectable, inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthGuard {
  constructor(private readonly router: Router) {}
  canActivate(): UrlTree | boolean {
    //TODO: Logincheck ? true : this.router.createUrlTree(["/auth/login"])
    return this.router.createUrlTree(['/auth/login']);
  }
}
export const isAuthed = () => {
  return inject(AuthGuard).canActivate();
};
