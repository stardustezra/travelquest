import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'travelquest-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form: FormGroup;
  errorMessage: string | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    const { email, password } = this.form.value;
    this.isSubmitting = true;

    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      console.log('Login successful');
      this.router.navigate(['/home']); // Redirect to home
    } catch (error) {
      this.errorMessage = 'Invalid email or password';
      console.error('Login error:', error);
    } finally {
      this.isSubmitting = false; // Reset submitting state
    }
  }

  clearError(): void {
    this.errorMessage = null;
  }
}
