import { Component, OnInit } from '@angular/core';
import { sessionStoreRepository } from '../../../shared/stores/session-store.repository';
import { Router } from '@angular/router';

@Component({
  selector: 'travelquest-profile-list',
  templateUrl: './profile-list.component.html',
  styleUrls: ['./profile-list.component.scss'],
})
export class ProfileListComponent implements OnInit {
  userProfile: any | null = null;
  loading: boolean = true;
  error: string | null = null;

  defaultProfilePic = 'assets/icons/default-profile-pic.png';

  categoryColors: { [key: string]: string } = {
    food: '#E7C933',
    culture: '#C852A2',
    activities: '#79D27F',
    sightseeing: '#5797EB',
    custom: '#8E77D2',
  };

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

  navigateToEditProfile() {
    this.router.navigate(['/profile-edit']);
  }
}
