import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';
import { SnackbarService } from '../../shared/snackbar/snackbar.service';
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
    private route: ActivatedRoute,
    private router: Router,
    private snackbarService: SnackbarService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.userId = params.get('id');
      if (this.userId) {
        this.fetchUserProfile(this.userId);
      } else {
        this.error = 'User ID not found in the route';
        this.loading = false;
        this.snackbarService.error('User ID not found in the route');
      }
    });
  }

  fetchUserProfile(uid: string): void {
    this.sessionStore.getUserProfile(uid).subscribe({
      next: (profile) => {
        this.loading = false;
        if (!profile) {
          this.error = 'Profile not found';
          this.snackbarService.error('Profile not found');
        } else {
          this.userProfile = profile;
          this.snackbarService.success('Profile loaded successfully!');
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = 'An error occurred while fetching the profile';
        this.snackbarService.error(
          'An error occurred while fetching the profile'
        );
      },
    });
  }

  navigateToChat(): void {
    this.router.navigate(['/chat']);
  }

  testColor(color: 'green' | 'red'): void {
    if (color === 'green') {
      this.snackbarService.success('This is a green success snackbar!');
    } else if (color === 'red') {
      this.snackbarService.error('This is a red error snackbar!');
    }
  }
}
