import { Component } from '@angular/core';
import { sessionStoreRepository } from '../../../shared/stores/session-store.repository';
import { Router } from '@angular/router';

@Component({
  selector: 'travelquest-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss'],
})
export class ProfileSettingsComponent {
  constructor(
    private sessionStore: sessionStoreRepository,
    private router: Router
  ) {}

  // Sign out the user using sessionStore
  signOut(): void {
    this.sessionStore
      .signOut()
      .then(() => {
        console.log('User signed out');
        this.router.navigate(['/auth/login']);
      })
      .catch((error) => {
        console.error('Error signing out: ', error);
      });
  }

  deleteAccount(): void {
    this.sessionStore
      .deleteAccount()
      .then(() => {
        console.log('User account and data deleted');
        this.router.navigate(['/']);
      })
      .catch((error) => {
        console.error('Error deleting account: ', error);
        alert('There was an error deleting your account. Please try again.');
      });
  }
}
