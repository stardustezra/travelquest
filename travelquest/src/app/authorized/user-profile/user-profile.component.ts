import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';
import { SnackbarService } from '../../shared/snackbar/snackbar.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'travelquest-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  encapsulation: ViewEncapsulation.None,
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
        console.log('User ID from route:', this.userId); // Debugging log
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
    if (this.userId) {
      console.log('Navigating to chat with user ID:', this.userId); // Debugging log
      this.router.navigate([`/chat/${this.userId}`]); // Navigate to chat
    } else {
      this.error = 'User ID is missing!';
      console.error('Cannot navigate to chat. User ID is missing.');
    }
  }
}
