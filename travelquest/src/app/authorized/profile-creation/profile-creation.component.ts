import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
} from '@angular/fire/storage';

interface UserData {
  bio: string;
  languages: string[];
  hashtags: string[];
  photoURL?: string; // Optional property
}

@Component({
  selector: 'app-profile-creation',
  templateUrl: './profile-creation.component.html',
  styleUrls: ['./profile-creation.component.scss'],
})
export class ProfileCreationComponent {
  profileForm: FormGroup;
  availableLanguages = ['English', 'Spanish', 'French', 'German', 'Chinese'];
  availableHashtags = [
    '#hiking',
    '#dancing',
    '#cooking',
    '#photography',
    '#traveling',
  ];

  previewUrl: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private auth: Auth,
    private storage: Storage
  ) {
    this.profileForm = this.fb.group({
      bio: ['', [Validators.required, Validators.maxLength(250)]],
      languages: [[], Validators.required],
      hashtags: [[], Validators.required],
    });
  }

  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files[0]) {
      this.selectedFile = fileInput.files[0];

      // Show a preview of the selected image
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.profileForm.invalid) return;

    try {
      const user = this.auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      // Create user data object
      const userData: UserData = {
        bio: this.profileForm.value.bio,
        languages: this.profileForm.value.languages,
        hashtags: this.profileForm.value.hashtags,
      };

      // Upload Profile Photo to Firebase Storage
      if (this.selectedFile) {
        const photoRef = ref(this.storage, `profilePhotos/${user.uid}`);
        await uploadBytes(photoRef, this.selectedFile);
        const photoURL = await getDownloadURL(photoRef);
        userData.photoURL = photoURL; // Add photo URL to user data
      }

      // Save User Data to Firestore
      const userDocRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userDocRef, userData, { merge: true });

      console.log('Profile saved successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  }
}
