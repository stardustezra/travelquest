import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router'; // Import ActivatedRoute
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';
import { Observable } from 'rxjs';

@Component({
  selector: 'travelquest-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit {
  userProfile: any;
  loading: boolean = true;
  error: string | null = null;
  userId: string | null = null;

  constructor(
    private sessionStore: sessionStoreRepository,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get the user ID from the route parameter
    this.route.paramMap.subscribe((params) => {
      this.userId = params.get('id');
      if (this.userId) {
        this.fetchUserProfile(this.userId);
      } else {
        this.error = 'User ID not found in the route';
        this.loading = false;
      }
    });
  }

  fetchUserProfile(uid: string): void {
    // Use the userId from the route to fetch the profile
    this.sessionStore.getUserProfile(uid).subscribe({
      next: (profile) => {
        this.loading = false;
        if (!profile) {
          this.error = 'Profile not found';
        } else {
          this.userProfile = profile;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'An error occurred while fetching the profile';
      },
    });
  }
}
