import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { sessionStoreRepository } from '../../../shared/stores/session-store.repository';
import ISO6391 from 'iso-639-1';
import { ENTER, COMMA } from '@angular/cdk/keycodes';

interface Hashtag {
  tag: string;
  category: string;
  color: string;
}

@Component({
  selector: 'travelquest-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.scss'],
})
export class ProfileEditComponent implements OnInit {
  profileForm!: FormGroup;
  languages: string[] = [];
  availableLanguages: string[] = [];
  predefinedHashtags: Hashtag[] = [];
  customHashtags: string[] = [];
  selectedHashtags: { tag: string; category: string }[] = [];
  separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    private fb: FormBuilder,
    private sessionStore: sessionStoreRepository,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchPredefinedHashtags();

    this.sessionStore.getSignedInUserProfile().subscribe((userProfile) => {
      const selectedHashtags = userProfile?.hashtags || [];
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
        hashtags: [selectedHashtags, Validators.required], // Pre-populate with picked hashtags
      });
    });
  }

  fetchAvailableLanguages(): void {
    this.availableLanguages = ISO6391.getAllNames().sort(
      (a, b) => a.localeCompare(b) // Sort alphabetically
    );
    console.log(
      'Available Languages (Alphabetically Sorted):',
      this.availableLanguages
    );
  }

  fetchPredefinedHashtags(): void {
    this.sessionStore.fetchPredefinedHashtags().then((hashtags) => {
      this.predefinedHashtags = hashtags; // Populate predefined hashtags
    });
  }

  addCustomHashtag(event: any): void {
    const input = event.input;
    const value = event.value;

    // Add custom hashtag if it exists
    if ((value || '').trim()) {
      this.customHashtags.push(value.trim());
    }

    // Clear input field
    if (input) {
      input.value = '';
    }
  }

  removeCustomHashtag(tag: string): void {
    const index = this.customHashtags.indexOf(tag);

    if (index >= 0) {
      this.customHashtags.splice(index, 1);
    }
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      const updatedData = {
        ...this.profileForm.value,
        hashtags: this.predefinedHashtags
          .filter((h) => this.profileForm.value.hashtags.includes(h.tag))
          .map((h) => ({ tag: h.tag, category: h.category })),
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
