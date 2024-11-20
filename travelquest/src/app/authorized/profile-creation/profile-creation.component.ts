import { Component, OnInit } from '@angular/core';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';

interface Hashtag {
  tag: string;
  category: string;
  color: string;
}

interface UserData {
  bio: string;
  languages: string[];
  hashtags: { tag: string; category: string }[];
  photoURL?: string; // Ensure this property is optional and included in the UserData interface
}

@Component({
  selector: 'app-profile-creation',
  templateUrl: './profile-creation.component.html',
  styleUrls: ['./profile-creation.component.scss'],
})
export class ProfileCreationComponent implements OnInit {
  profileForm: FormGroup;
  availableLanguages = ['English', 'Spanish', 'French', 'German', 'Chinese'];
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
      bio: ['', [Validators.required, Validators.maxLength(250)]],
      languages: [[], Validators.required],
    });
  }

  ngOnInit(): void {
    console.log('Initializing Profile Creation Component...');
    this.fetchPredefinedHashtags();

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
        hashtags,
      };

      if (this.selectedFile) {
        console.log('Uploading profile photo...');
        const photoURL = await this.sessionStore.uploadProfilePhoto(
          this.selectedFile
        );
        userData.photoURL = photoURL; // Ensure photoURL is set correctly
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
