import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { Firestore, collection, addDoc } from '@angular/fire/firestore';

@Component({
  selector: 'travelquest-login',
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  form: FormGroup;
  errorMessage: string | null = null;
  maxDate: Date;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private firestore: Firestore
  ) {
    this.maxDate = new Date(); // Set the max date to today
    this.form = this.fb.group({
      name: ['', Validators.required],
      dob: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
    const { name, dob, email, password, confirmPassword } = this.form.value;

    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    try {
      // Register the user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Save user info to Firestore
      const user = userCredential.user;
      const usersCollection = collection(this.firestore, 'users'); // Reference to 'users' collection
      await addDoc(usersCollection, {
        uid: user.uid,
        name: name,
        dob: dob,
        email: email,
        createdAt: new Date().toISOString(),
      });

      console.log('Registration and Firestore save successful');
    } catch (error) {
      this.errorMessage = 'Registration failed. Please try again.';
      console.error('Registration error:', error);
    }
  }
}
