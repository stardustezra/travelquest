import { Component, OnInit } from '@angular/core';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';
import ISO6391 from 'iso-639-1';
import ISO3166 from 'iso-3166-1';

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
    private sessionStore: sessionStoreRepository
  ) {
    // Initialize form
    this.profileForm = this.fb.group({
      bio: ['', [Validators.maxLength(250)]],
      languages: [[], Validators.required],
      country: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    console.log('Initializing Profile Creation Component...');
    this.fetchAvailableLanguages();
    this.fetchPredefinedHashtags();
    this.fetchAvailableCountries();

    // Fetch the current user's UID
    this.sessionStore.getCurrentUserUID().subscribe({
      next: (uid) => {
        if (uid) {
          this.isAuthenticated = true;
          console.log('Authenticated User UID:', uid);

          // Fetch user profile
          this.sessionStore.getUserProfile(uid).subscribe({
            next: (profile) => {
              this.currentUser = profile;
              console.log('Current User Profile:', profile);
            },
            error: (err) => console.error('Error fetching user profile:', err),
          });
        } else {
          this.isAuthenticated = false;
          console.warn('No authenticated user found.');
        }
      },
      error: (err) => console.error('Error retrieving UID:', err),
    });
  }

  // Fetch all available languages using iso-639-1
  fetchAvailableLanguages(): void {
    this.availableLanguages = ISO6391.getAllNames().sort(
      (a, b) => a.localeCompare(b) // Sort alphabetically
    );
    console.log(
      'Available Languages (Alphabetically Sorted):',
      this.availableLanguages
    );
  }

  // Fetch all available countries using iso-3166-1
  fetchAvailableCountries(): void {
    const countries = ISO3166.all();

    if (!countries || countries.length === 0) {
      console.error('ISO3166.all() returned no data or an empty array');
      return;
    }

    // Map and sort
    this.availableCountries = countries
      .map((country: any) => country.country) // Use 'country' for mapping
      .sort();
  }

  async fetchPredefinedHashtags(): Promise<void> {
    try {
      console.log('Fetching predefined hashtags...');
      this.predefinedHashtags =
        await this.sessionStore.fetchPredefinedHashtags();
      console.log('Fetched Hashtags:', this.predefinedHashtags);
    } catch (error) {
      console.error('Error fetching predefined hashtags:', error);
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
    console.log('Selected Hashtags:', this.selectedHashtags);
  }

  addCustomHashtag(event: any): void {
    const input = event.chipInput?.inputElement;
    const value = (event.value || '').trim();

    const isValidHashtag = /^#[a-zA-Z0-9-_]+$/.test(value);

    if (isValidHashtag && this.totalTagsSelected() < 10) {
      this.customHashtags.push(value);
      console.log('Custom Hashtag Added:', value);
    } else if (!isValidHashtag && value) {
      console.error('Invalid hashtag format:', value);
    }

    if (input) {
      input.value = '';
    }
    console.log('Custom Hashtags:', this.customHashtags);
  }

  removeCustomHashtag(tagToRemove: string): void {
    this.customHashtags = this.customHashtags.filter(
      (tag) => tag !== tagToRemove
    );
    console.log('Custom Hashtags after removal:', this.customHashtags);
  }

  totalTagsSelected(): number {
    return this.selectedHashtags.length + this.customHashtags.length;
  }

  findCategoryForTag(tag: string): string | undefined {
    const hashtag = this.predefinedHashtags.find((ht) => ht.tag === tag);
    return hashtag?.category;
  }

  async onSubmit(): Promise<void> {
    console.log('Submit button clicked.');

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
      console.log('Current User:', this.currentUser);

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
        console.log('Uploading profile photo...');
        const photoURL = await this.sessionStore.uploadProfilePhoto(
          this.selectedFile
        );
        userData.photoURL = photoURL;
        console.log('Profile photo uploaded. URL:', photoURL);
      }

      console.log('User Data to Save:', userData);
      await this.sessionStore.saveUserProfile(userData);
      console.log('Profile saved successfully!');

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
      console.log('Selected File:', this.selectedFile.name);

      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
        console.log('File preview updated.');
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
}
