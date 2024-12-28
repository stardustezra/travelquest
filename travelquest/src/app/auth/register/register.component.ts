import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';
import { Router } from '@angular/router';

@Component({
  selector: 'travelquest-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  form: FormGroup;
  errorMessage: string | null = null;
  maxDate: Date;

  constructor(
    private fb: FormBuilder,
    private readonly sessionStore: sessionStoreRepository,
    private readonly router: Router
  ) {
    this.maxDate = new Date();
    // TODO: Set required date to 18 years ago
    this.form = this.fb.group({
      name: ['', Validators.required],
      dob: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.errorMessage = 'Please fill out all fields correctly.';
      return;
    }

    const { name, dob, email, password, confirmPassword } = this.form.value;

    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.errorMessage = null;

    this.sessionStore.register(email, name, password, dob).subscribe({
      next: () => {
        this.router.navigate(['/profile-creation']); // Navigate to home after successful registration
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.errorMessage =
          error?.message || 'Registration failed. Please try again.';
      },
    });
  }

  async signInWithGoogle(): Promise<void> {
    this.sessionStore.googleSignIn().subscribe({
      next: () => {
        this.router.navigate(['/profile-creation']); // Navigate to home after sign-in
      },
      error: (error) => {
        console.error('Google Sign-In error:', error);
        this.errorMessage = 'Google Sign-In failed. Please try again.';
      },
    });
  }
}
