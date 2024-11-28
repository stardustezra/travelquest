import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { sessionStoreRepository } from '../../../shared/stores/session-store.repository';
import ISO6391 from 'iso-639-1';

@Component({
  selector: 'travelquest-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss'],
})
export class ProfileEditComponent implements OnInit {
  profileForm!: FormGroup;
  availableLanguages: string[] = [];
  predefinedHashtags: { tag: string; category: string }[] = [];
  customHashtags: string[] = [];
  userProfile: any; // Assuming userProfile is available from sessionStore

  constructor(
    private fb: FormBuilder,
    private sessionStore: sessionStoreRepository,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchAvailableLanguages();

    // Assuming user profile is available via sessionStore
    this.sessionStore.getSignedInUserProfile().subscribe((userProfile) => {
      this.userProfile = userProfile;
      this.predefinedHashtags = userProfile?.hashtags || []; // Assuming predefined hashtags are part of the user profile
      this.customHashtags = userProfile?.customHashtags || [];

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
        languages: [userProfile?.languages || [], Validators.required],
        country: [userProfile?.country || ''],
      });
    });
  }

  fetchAvailableLanguages(): void {
    this.availableLanguages = ISO6391.getAllNames().sort((a, b) =>
      a.localeCompare(b)
    );
  }

  updateSelectedHashtags(
    updatedHashtags: { tag: string; category: string }[]
  ): void {
    this.predefinedHashtags = updatedHashtags;
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      const updatedData = {
        ...this.profileForm.value,
        predefinedHashtags: this.predefinedHashtags,
        customHashtags: this.customHashtags,
      };

      this.sessionStore
        .saveUserProfile(updatedData)
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
