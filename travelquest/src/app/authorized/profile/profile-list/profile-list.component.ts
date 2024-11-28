import { Component, OnInit } from '@angular/core';
import { sessionStoreRepository } from '../../../shared/stores/session-store.repository';
import { Router } from '@angular/router';
import { UserProfile } from '../../../shared/models/user-profile.model';

@Component({
  selector: 'travelquest-profile-list',
  templateUrl: './profile-list.component.html',
  styleUrls: ['./profile-list.component.scss'],
})
export class ProfileListComponent implements OnInit {
  userProfile: UserProfile | null = null;
  loading: boolean = true;
  error: string | null = null;

  constructor(
    private readonly sessionStore: sessionStoreRepository,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.sessionStore.getSignedInUserProfile().subscribe({
      next: (profile) => {
        if (profile) {
          this.userProfile = profile;
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

  get profilePictureUrl(): string {
    if (this.userProfile?.profilePicture) {
      return 'assets/' + this.userProfile.profilePicture;
    }
    return 'assets/icons/default-profile-pic.png';
  }

  navigateToEditProfile() {
    this.router.navigate(['/profile-edit']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }
}
