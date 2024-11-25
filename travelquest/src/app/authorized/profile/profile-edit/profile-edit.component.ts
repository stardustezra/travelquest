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
  languages: string[] = [];

  constructor(
    private fb: FormBuilder,
    private sessionStore: sessionStoreRepository,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Fetch languages from session store
    const storedLanguages = sessionStorage.getItem('languages');
    if (storedLanguages) {
      this.languages = JSON.parse(storedLanguages);
    }

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
        languages: [userProfile?.languages || []],
        country: [userProfile?.country || ''],
      });
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.sessionStore
        .saveUserProfile(this.profileForm.value)
        .then(() => {
          console.log('Profile updated successfully!');
          this.router.navigate(['/profile']);
        })
        .catch((error) => {
          console.error('Error updating profile:', error);
        });
    }
  }
}
