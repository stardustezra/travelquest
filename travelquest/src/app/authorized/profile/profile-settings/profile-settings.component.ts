import { Component } from '@angular/core';
import { sessionStoreRepository } from '../../../shared/stores/session-store.repository';
import { Router } from '@angular/router';
import { SnackbarService } from '../../../shared/snackbar/snackbar.service';

@Component({
  selector: 'travelquest-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.scss'],
})
export class ProfileSettingsComponent {
  constructor(
    private sessionStore: sessionStoreRepository,
    private router: Router,
    private snackbarService: SnackbarService
  ) {}

  settingsSections = [
    { title: 'Travel Log' },
    { title: 'Support' },
    { title: 'FAQ' },
    { title: 'Terms and Conditions' },
  ];

  // Sign out the user using sessionStore
  signOut(): void {
    this.sessionStore
      .signOut()
      .then(() => {
        console.log('User signed out');
        this.snackbarService.success('You have been signed out successfully.');
        this.router.navigate(['/auth/login']);
      })
      .catch((error) => {
        console.error('Error signing out: ', error);
        this.snackbarService.error(
          'An error occurred while signing out. Please try again.'
        );
      });
  }

  deleteAccount(): void {
    this.sessionStore
      .deleteAccount()
      .then(() => {
        console.log('User account and data deleted');
        this.snackbarService.success(
          'Your account has been deleted successfully.'
        );
        this.router.navigate(['/']);
      })
      .catch((error) => {
        console.error('Error deleting account: ', error);
        this.snackbarService.error(
          'There was an error deleting your account. Please try again.'
        );
      });
  }
}
