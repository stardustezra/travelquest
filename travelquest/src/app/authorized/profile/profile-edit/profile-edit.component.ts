import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { sessionStoreRepository } from '../../../shared/stores/session-store.repository';

@Component({
  selector: 'travelquest-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss'],
})
export class ProfileEditComponent implements OnInit {
  profileForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private sessionStore: sessionStoreRepository,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize form with existing user data
    this.sessionStore.getSignedInUserProfile().subscribe((userProfile) => {
      this.profileForm = this.fb.group({
        name: [userProfile?.name || '', Validators.required],
        email: [
          userProfile?.email || '',
          [Validators.required, Validators.email],
        ],
        dob: [
          userProfile?.dob ? new Date(userProfile.dob.toDate()) : '',
          Validators.required,
        ],
        bio: [userProfile?.bio || ''],
      });
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      // Save the updated profile data
      this.sessionStore
        .saveUserProfile(this.profileForm.value)
        .then(() => {
          console.log('Profile updated successfully!');
          // Navigate back to the profile view
          this.router.navigate(['/profile']);
        })
        .catch((error) => {
          console.error('Error updating profile:', error);
        });
    }
  }

  cancelEdit(): void {
    this.profileForm.reset();
    this.router.navigate(['/profile']);
  }
}
