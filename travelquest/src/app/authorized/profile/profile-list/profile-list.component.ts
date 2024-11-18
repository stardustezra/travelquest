import { Component, OnInit } from '@angular/core';
import { sessionStoreRepository } from '../../../shared/stores/session-store.repository';

@Component({
  selector: 'travelquest-profile-list',
  templateUrl: './profile-list.component.html',
  styleUrls: ['./profile-list.component.scss'],
})
export class ProfileListComponent implements OnInit {
  userProfile: any | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(private readonly sessionStore: sessionStoreRepository) {}

  ngOnInit(): void {
    this.sessionStore.getSignedInUserProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.userProfile = profile; // Set profile data
        } else {
          this.error = 'No profile data found for the signed-in user.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.error = 'An error occurred while fetching the profile data.';
        console.error(err);
        this.loading = false;
      },
    });
  }
}
