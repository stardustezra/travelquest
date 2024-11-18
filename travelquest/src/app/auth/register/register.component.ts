import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { sessionStoreRepository } from '../../shared/stores/session-store.repository';

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
    private readonly sessionStore: sessionStoreRepository
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
    if (this.form.invalid) {
      this.errorMessage = 'Please fill out all fields correctly.';
      return;
    }

    const { name, dob, email, password, confirmPassword } = this.form.value;

    if (password !== confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.errorMessage = null; // Clear any existing error

    this.sessionStore.register(email, name, password, dob).subscribe({
      next: () => {
        console.log('Registration successful');
        this.errorMessage = null;
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.errorMessage =
          error?.message || 'Registration failed. Please try again.';
      },
    });
  }
}
