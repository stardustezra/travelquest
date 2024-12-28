import { Component, OnInit } from '@angular/core';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';
import ISO6391 from 'iso-639-1';
import ISO3166 from 'iso-3166-1';
import { SnackbarService } from '../../shared/snackbar/snackbar.service';

interface Hashtag {
  tag: string;
  category: string;
  color: string;
}

interface UserData {
  bio: string;
  languages: string[];
  country: string;
  hashtags: { tag: string; category: string }[];
  photoURL?: string;
}

@Component({
  selector: 'travelquest-profile-creation',
  templateUrl: './profile-creation.component.html',
  styleUrls: ['./profile-creation.component.scss'],
})
export class ProfileCreationComponent implements OnInit {
  profileForm: FormGroup;
  availableLanguages: string[] = [];
  availableCountries: string[] = [];
  predefinedHashtags: Hashtag[] = [];
  customHashtags: string[] = [];
  selectedHashtags: { tag: string; category: string }[] = [];
  separatorKeysCodes: number[] = [ENTER, COMMA];
  previewUrl: string | null = null;
  selectedFile: File | null = null;
  isAuthenticated: boolean = false;
  currentUser: any = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private sessionStore: sessionStoreRepository,
    private snackbarService: SnackbarService
  ) {
    // Initialize form
    this.profileForm = this.fb.group({
      bio: ['', [Validators.maxLength(250)]],
      languages: [[], Validators.required],
      country: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.fetchAvailableLanguages();
    this.fetchPredefinedHashtags();
    this.fetchAvailableCountries();

    // Fetch the current user's UID
    this.sessionStore.getCurrentUserUID().subscribe({
      next: (uid) => {
        if (uid) {
          this.isAuthenticated = true;

          // Fetch user profile
          this.sessionStore.getUserProfile(uid).subscribe({
            next: (profile) => {
              this.currentUser = profile;
            },
            error: (err) => {
              console.error('Error fetching user profile:', err);
              this.snackbarService.error(
                'Error fetching user profile. Please try again.'
              );
            },
          });
        } else {
          this.isAuthenticated = false;
        }
      },
      error: (err) => {
        console.error('Error retrieving UID:', err);
        this.snackbarService.error(
          'Error retrieving user UID. Please try again.'
        );
      },
    });
  }

  // Fetch all available languages using iso-639-1
  fetchAvailableLanguages(): void {
    this.availableLanguages = ISO6391.getAllNames().sort(
      (a, b) => a.localeCompare(b) // Sort alphabetically
    );
  }

  // Fetch all available countries using iso-3166-1
  fetchAvailableCountries(): void {
    const countries = ISO3166.all();

    if (!countries || countries.length === 0) {
      console.error('ISO3166.all() returned no data or an empty array');
      this.snackbarService.error('Error fetching countries. Please try again.');
      return;
    }

    // Map and sort
    this.availableCountries = countries
      .map((country: any) => country.country) // Use 'country' for mapping
      .sort();
  }

  async fetchPredefinedHashtags(): Promise<void> {
    try {
      this.predefinedHashtags =
        await this.sessionStore.fetchPredefinedHashtags();
    } catch (error) {
      console.error('Error fetching predefined hashtags:', error);
      this.snackbarService.error(
        'Error fetching predefined hashtags. Please try again.'
      );
    }
  }

  isHashtagSelected(tag: string): boolean {
    return this.selectedHashtags.some((hashtag) => hashtag.tag === tag);
  }

  toggleHashtag(tag: string): void {
    const category = this.findCategoryForTag(tag);
    const existingIndex = this.selectedHashtags.findIndex(
      (hashtag) => hashtag.tag === tag
    );

    if (existingIndex >= 0) {
      this.selectedHashtags.splice(existingIndex, 1);
    } else if (this.totalTagsSelected() < 10) {
      this.selectedHashtags.push({ tag, category: category ?? 'custom' });
    }
  }

  addCustomHashtag(event: any): void {
    const input = event.chipInput?.inputElement;
    let value = (event.value || '').trim();

    // Prepend '#' if not already present
    if (value && !value.startsWith('#')) {
      value = `#${value}`;
    }

    const isValidHashtag = /^#[a-zA-Z0-9-_]+$/.test(value);

    if (isValidHashtag && this.totalTagsSelected() < 10) {
      this.customHashtags.push(value);

      // Sync with FormGroup
      this.profileForm.get('customHashtags')?.setValue(this.customHashtags);
    } else if (!isValidHashtag && value) {
      console.error('Invalid hashtag format:', value);
    }

    if (input) {
      input.value = '';
    }
  }

  removeCustomHashtag(tagToRemove: string): void {
    this.customHashtags = this.customHashtags.filter(
      (tag) => tag !== tagToRemove
    );
  }

  totalTagsSelected(): number {
    return this.selectedHashtags.length + this.customHashtags.length;
  }

  findCategoryForTag(tag: string): string | undefined {
    const hashtag = this.predefinedHashtags.find((ht) => ht.tag === tag);
    return hashtag?.category;
  }

  async onSubmit(): Promise<void> {
    if (!this.isAuthenticated) {
      console.error('User is not authenticated. Cannot save profile.');
      alert('Please log in to save your profile.');
      return;
    }

    if (this.profileForm.invalid) {
      console.error('Form is invalid:', this.profileForm.value);
      alert('Please fill out all required fields.');
      return;
    }

    try {
      const hashtags = [
        ...this.selectedHashtags,
        ...this.customHashtags.map((tag) => ({ tag, category: 'custom' })),
      ];

      const userData: UserData = {
        bio: this.profileForm.value.bio,
        languages: this.profileForm.value.languages,
        country: this.profileForm.value.country,
        hashtags,
      };

      if (this.selectedFile) {
        const photoURL = await this.sessionStore.uploadProfilePhoto(
          this.selectedFile
        );
        userData.photoURL = photoURL;
      }

      await this.sessionStore.saveUserProfile(userData);

      // Redirect to the home page
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('An error occurred while saving your profile. Please try again.');
    }
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      this.selectedFile = fileInput.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
}
